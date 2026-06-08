import cron from "node-cron";
import axios from "axios";
import Sales from "../models/salesModel.js";
import 'dotenv/config'

const REPORT_HOUR = process.env.DAILY_REPORT_HOUR || 17;
const REPORT_MINUTE = process.env.DAILY_REPORT_MINUTE || 0;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8995727092:AAHP9Ju6ApVkMByfluI6jjc4nerKuuieZO4";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

const fmt = (n) => isNaN(n) ? "0" : Math.round(Number(n)).toLocaleString("en-US");

// ════════════════════════════════════════════════════════════════════════
// 📊 احسب الإحصائيات اليومية
// ════════════════════════════════════════════════════════════════════════
const calculateDailyStats = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        console.log(`📅 [DailyStats] Fetching sales from ${today.toISOString()} to ${tomorrow.toISOString()}`);

        const todaysSales = await Sales.find({
            invoiceType: "sales",
            createdAt: { $gte: today, $lt: tomorrow },
        });

        console.log(`📊 [DailyStats] Found ${todaysSales.length} sales invoices today`);

        let totalSalesToday = 0;
        let totalRevenue = 0;
        let totalNetProfit = 0;

        todaysSales.forEach((sale) => {
            totalSalesToday++;
            totalRevenue += sale.totalAmount || 0;
            totalNetProfit += sale.netProfit || 0;
        });

        const avgTransactionValue = totalSalesToday > 0
            ? totalRevenue / totalSalesToday
            : 0;

        console.log(`📊 [DailyStats] عمليات: ${totalSalesToday} | إيرادات: ${totalRevenue} ج.م | ربح: ${totalNetProfit} ج.م`);

        return {
            totalSalesToday,
            totalRevenue,
            totalNetProfit,
            avgTransactionValue,
            date: today.toISOString().split("T")[0],
        };
    } catch (err) {
        console.error("❌ [DailyStats] خطأ في حساب الإحصائيات:", err.message);
        throw err;
    }
};

// ════════════════════════════════════════════════════════════════════════
// � Send report directly to admin via Telegram
// ════════════════════════════════════════════════════════════════════════
export const sendReportToAdmin = async (stats) => {
    try {
        if (!TELEGRAM_ADMIN_CHAT_ID) {
            console.error("❌ [SendReport] TELEGRAM_ADMIN_CHAT_ID is not set in .env");
            return { ok: false, error: "TELEGRAM_ADMIN_CHAT_ID not configured" };
        }

        const { totalSalesToday = 0, totalRevenue = 0, totalNetProfit = 0, avgTransactionValue = 0 } = stats;
        const pct = totalRevenue > 0 ? ((totalNetProfit / totalRevenue) * 100).toFixed(1) : "0";

        let perf = { e: "⚠️", t: "اليوم بحاجة لجهود تسويقية" };
        if (totalSalesToday > 100) perf = { e: "🚀", t: "يوم رائع! استمر بنفس الزخم" };
        else if (totalSalesToday > 50) perf = { e: "⬆️", t: "أداء جيد حتى الآن" };
        else if (totalSalesToday > 20) perf = { e: "📊", t: "أداء معقول، يمكن تحسينه" };

        const now = new Date();
        const html = [
            `📊 <b>تقرير البيع اليومي</b>`, ``,
            `📅 ${now.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}`,
            `⏰ ${now.toLocaleTimeString("ar-EG")}`, ``,
            `🛒 عدد المبيعات: <b>${totalSalesToday}</b> عملية`,
            `💵 إجمالي الإيرادات: <b>${fmt(totalRevenue)} ج.م</b>`,
            `💰 صافي الربح: <b>${fmt(totalNetProfit)} ج.م</b>`,
            `📈 نسبة الربح: <b>${pct}%</b>`,
            `📊 متوسط المعاملة: <b>${fmt(avgTransactionValue)} ج.م</b>`, ``,
            `────────────────────────────────`,
            `${perf.e} <b>تقييم الأداء:</b> ${perf.t}`, ``,
            `📌 تم إنشاء هذا التقرير تلقائياً`,
        ].join("\n");

        console.log(`📤 [SendReport] إرسال التقرير إلى chat ID: ${TELEGRAM_ADMIN_CHAT_ID}`);
        const response = await axios.post(
            `${TELEGRAM_API}/sendMessage`,
            { chat_id: String(TELEGRAM_ADMIN_CHAT_ID), text: html, parse_mode: "HTML" },
            { timeout: 10000 }
        );

        if (response.data?.ok) {
            console.log(`✅ [SendReport] تم إرسال التقرير بنجاح`);
            return { ok: true };
        } else {
            const error = response.data?.description || "Unknown error";
            console.error(`❌ [SendReport] Telegram error: ${error}`);
            return { ok: false, error };
        }
    } catch (err) {
        console.error("❌ [SendReport] Catch block error details:");
        console.error("   err.response:", err.response?.status, err.response?.statusText);
        console.error("   err.response.data:", err.response?.data);
        console.error("   err.message:", err.message);
        console.error("   Full err:", err);

        const detail = err.response?.data?.description ?? err.response?.data?.error?.description ?? err.message ?? "Unknown error";
        console.error(`❌ [SendReport] خطأ في الإرسال: ${detail}`);
        return { ok: false, error: detail };
    }
};

// ════════════════════════════════════════════════════════════════════════
// �🚀 ابدأ جدولة التقرير اليومي
// ════════════════════════════════════════════════════════════════════════
export const startDailyReportScheduler = () => {
    try {
        const cronExpression = `${REPORT_MINUTE} ${REPORT_HOUR} * * *`;

        console.log(`⏰ [Scheduler] تم تشغيل جدولة التقرير اليومي`);
        console.log(`   الساعة: ${REPORT_HOUR}:${String(REPORT_MINUTE).padStart(2, "0")}`);
        console.log(`   Chat ID: ${TELEGRAM_ADMIN_CHAT_ID || "NOT SET ❌"}`);
        console.log(`   Cron Expression: ${cronExpression}`);

        cron.schedule(cronExpression, async () => {
            console.log("\n🔔 [Scheduler] بدء إرسال التقرير اليومي...");
            try {
                const stats = await calculateDailyStats();
                const result = await sendReportToAdmin(stats);

                if (result.ok) {
                    console.log(`✅ [Scheduler] تم إرسال التقرير بنجاح`);
                } else {
                    console.error(`⚠️ [Scheduler] فشل الإرسال: ${result.error}`);
                }
            } catch (err) {
                console.error(`❌ [Scheduler] خطأ في التقرير اليومي:`, err.message);
            }
        });

        console.log("✅ جدولة التقرير اليومي جاهزة!");
    } catch (err) {
        console.error("❌ [Scheduler] فشل بدء الجدولة:", err.message);
        throw err;
    }
};

// ════════════════════════════════════════════════════════════════════════
// 🧪 اختبار فوري
// ════════════════════════════════════════════════════════════════════════
export const testDailyReportNow = async () => {
    try {
        console.log("🧪 [Test] تشغيل التقرير الآن...");
        const stats = await calculateDailyStats();
        const result = await sendReportToAdmin(stats);
        console.log("✅ [Test] النتيجة:", result);
        return result;
    } catch (err) {
        console.error("❌ [Test] خطأ:", err.message);
        throw err;
    }
};

export default { startDailyReportScheduler, testDailyReportNow, calculateDailyStats };