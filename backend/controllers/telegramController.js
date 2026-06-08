import axios from "axios";
import User from "../models/userModel.js";
import telegramBotService from "../services/Telegrambotservice .js";
import { sendReportToAdmin } from "../services/Dailyreportscheduler.js";
import { uploadImageToCloudinary } from "../services/cloudinaryService.js";
import fs from "fs";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "your_bot_token_here";
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ✅ Validation: Ensure token is configured
if (!BOT_TOKEN) {
    console.error("❌ CRITICAL: TELEGRAM_BOT_TOKEN is not set in .env file!");
    console.error("📋 Add this to your .env file:");
    console.error("   TELEGRAM_BOT_TOKEN=your_bot_token_here");
    console.error("   TELEGRAM_ADMIN_CHAT_ID=your_admin_chat_id_here");
}

// ════════════════════════════════════════════════════════════════════════
// 🛠️ HELPERS
// ════════════════════════════════════════════════════════════════════════
const escHtml = (s) =>
    String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const fmt = (n) =>
    isNaN(n) ? "0" : Math.round(Number(n)).toLocaleString("en-US");

// ════════════════════════════════════════════════════════════════════════
// 📸 upload-image
//   رفع صورة إلى Cloudinary بدون بث
//   
//   POST /api/telegram/upload-image
//   Body: FormData with file
// ════════════════════════════════════════════════════════════════════════
export const uploadImage = async (req, res) => {
    const uploadedFilePaths = [];

    try {
        const file = req.file;

        // ✅ التحقق من وجود الملف
        if (!file) {
            return res.status(400).json({
                success: false,
                error: "لم يتم تحديد ملف"
            });
        }

        // 📤 رفع الصورة إلى Cloudinary
        console.log(`📤 جاري رفع الصورة إلى Cloudinary...`);
        const imageUrl = await uploadImageToCloudinary(file.path);
        uploadedFilePaths.push(file.path);
        console.log(`✅ تم الحصول على رابط الصورة: ${imageUrl}`);

        // ✅ النتيجة النهائية
        res.status(200).json({
            success: true,
            message: "تم رفع الصورة بنجاح إلى Cloudinary",
            imageUrl: imageUrl
        });

    } catch (error) {
        console.error("❌ [Upload] خطأ:", error.message);
        res.status(500).json({
            success: false,
            error: error.message || "فشل رفع الصورة"
        });
    } finally {
        // 🗑️ تنظيف الملفات المؤقتة
        for (const filePath of uploadedFilePaths) {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️ تم حذف الملف المؤقت: ${filePath}`);
                }
            } catch (err) {
                console.error(`⚠️ خطأ في حذف الملف ${filePath}:`, err.message);
            }
        }
    }
};

/**
 * Core send — returns { ok, error? } — NEVER throws
 * so a Telegram failure never crashes the main business logic
 */
const sendTelegramMessage = async (chatId, html) => {
    // ✅ Validation checks
    if (!BOT_TOKEN) {
        const err = "❌ TELEGRAM_BOT_TOKEN not configured in .env";
        console.error(err);
        return { ok: false, error: err };
    }

    if (!chatId || !html) {
        const err = "❌ chatId or html missing";
        console.error(err);
        return { ok: false, error: err };
    }

    try {
        console.log(`📤 [Telegram] Sending to chat: ${chatId}`);
        const response = await axios.post(
            `${TELEGRAM_API_URL}/sendMessage`,
            {
                chat_id: String(chatId),
                text: html,
                parse_mode: "HTML"
            },
            { timeout: 12000 }
        );

        console.log(`✅ [Telegram] Message sent successfully to chat ${chatId}`);
        return { ok: true };
    } catch (err) {
        const detail = err.response?.data?.description ?? err.message;
        const code = err.response?.status ?? err.code ?? "UNKNOWN";

        console.error(`❌ [Telegram] Failed to send to chat ${chatId}`);
        console.error(`   HTTP Status: ${code}`);
        console.error(`   Error: ${detail}`);

        // Helpful error messages for common issues
        if (code === 401) {
            console.error(`   💡 Hint: Check if TELEGRAM_BOT_TOKEN in .env is correct`);
        } else if (code === 400 && detail.includes("chat_id")) {
            console.error(`   💡 Hint: Invalid chat_id "${chatId}". Make sure user linked Telegram with /start`);
        }

        return {
            ok: false,
            error: `Telegram (${code}): ${detail}`,
            chatId,
            code
        };
    }
};

// ════════════════════════════════════════════════════════════════════════
// 📄 send-invoice
//   Accepts:  { phone, invoiceDetails }
//        OR:  { chatId, invoiceDetails }
// ════════════════════════════════════════════════════════════════════════
export const sendInvoiceByPhone = async (req, res) => {
    try {
        const { phone, chatId } = req.body;
        // Accept both "invoice" and "invoiceDetails" field names
        const invoiceDetails = req.body.invoiceDetails || req.body.invoice;

        if (!invoiceDetails) {
            return res.status(400).json({ success: false, error: "invoiceDetails (or invoice) مطلوبة" });
        }

        let resolvedChatId = null;
        let resolvedUserName = "العميل";

        // ── resolve by phone ─────────────────────────────────────────────
        if (phone) {
            const normalized = telegramBotService.normalizePhoneNumber(phone);
            const user = await User.findOne({ phone: normalized });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: `لم يُعثر على مستخدم بالهاتف: ${normalized}`,
                    hint: "تأكد أن رقم الهاتف مسجَّل في النظام",
                });
            }

            if (!user.telegramChatId) {
                return res.status(200).json({
                    success: false,
                    warning: true,
                    error: `"${user.name}" لم يربط Telegram بعد`,
                    hint: `اطلب منه إرسال /start للبوت ثم اضغط "مشاركة رقم الهاتف"`,
                    userId: user._id,
                    userName: user.name,
                    needsLink: true,
                });
            }

            resolvedChatId = user.telegramChatId;
            resolvedUserName = user.name;

            // ── direct chatId ────────────────────────────────────────────────
        } else if (chatId) {
            const s = String(chatId).trim();
            if (!/^-?\d+$/.test(s)) {
                return res.status(400).json({
                    success: false,
                    error: `chatId "${s}" يجب أن يكون رقماً لا اسم مستخدم`,
                    hint: "ابعث /start للبوت ثم افتح GET /api/telegram/get-updates",
                });
            }
            resolvedChatId = s;
        } else {
            return res.status(400).json({
                success: false,
                error: "يجب إرسال phone أو chatId",
            });
        }

        // ── Build HTML invoice ───────────────────────────────────────────
        const {
            invoiceNumber = "N/A",
            items = [],
            totalAmount = 0,
            paidAmount = 0,
            remainingAmount = 0,
        } = invoiceDetails;

        const itemsHtml = items.length
            ? items.map((i) => {
                // Accept both "price" and "salePrice" field names
                const price = i.salePrice || i.price || 0;
                const line = (i.quantity || 0) * price;
                return `• <b>${escHtml(i.name)}</b> — ${i.quantity} × ${fmt(price)} = <b>${fmt(line)} ج.م</b>`;
            }).join("\n")
            : "لا توجد منتجات";

        const now = new Date();
        const html = [
            `✅ <b>فاتورة مبيعات</b>`,
            ``,
            `🔖 رقم الفاتورة: <code>${escHtml(invoiceNumber)}</code>`,
            `👤 العميل: <b>${escHtml(resolvedUserName)}</b>`,
            `📅 ${now.toLocaleDateString("ar-EG")}  ⏰ ${now.toLocaleTimeString("ar-EG")}`,
            ``,
            `📦 <b>المنتجات:</b>`,
            itemsHtml,
            ``,
            `────────────────────────`,
            `💵 الإجمالي: <b>${fmt(totalAmount)} ج.م</b>`,
            `✅ المدفوع:  <b>${fmt(paidAmount)} ج.م</b>`,
            `⏳ المتبقي:  <b>${fmt(remainingAmount)} ج.م</b>`,
            ``,
            `🎯 شكراً لك على الشراء!`,
        ].join("\n");

        // ── Send — non-blocking: sale already succeeded ──────────────────
        const result = await sendTelegramMessage(resolvedChatId, html);

        if (!result.ok) {
            // ✅ Return 200 with a warning — don't fail the whole request
            return res.status(200).json({
                success: false,
                warning: true,
                error: result.error,
                hint: "الفاتورة أُنشئت بنجاح لكن إرسال Telegram فشل. تأكد أن المستخدم أرسل /start للبوت.",
                sentTo: { chatId: resolvedChatId, name: resolvedUserName },
            });
        }

        res.status(200).json({
            success: true,
            message: "✅ تم إرسال الفاتورة عبر Telegram",
            sentTo: { chatId: resolvedChatId, name: resolvedUserName },
        });

    } catch (err) {
        console.error("❌ [send-invoice]", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

// alias for old route name
export const sendInvoiceNotification = sendInvoiceByPhone;

// ════════════════════════════════════════════════════════════════════════
// 🔄 send-return-alert
// ════════════════════════════════════════════════════════════════════════
export const sendReturnAlert = async (req, res) => {
    try {
        const { managerChatId, returnRequest } = req.body;
        if (!managerChatId || !returnRequest)
            return res.status(400).json({ success: false, error: "managerChatId و returnRequest مطلوبان" });

        const {
            invoiceNumber = "N/A", cashierName = "كاشير",
            returnItems = [], totalRefundAmount = 0, reason = "لم يُحدَّد",
        } = returnRequest;

        const itemsHtml = returnItems.map((i) => `• ${escHtml(i.name)} — ${i.quantity} قطعة`).join("\n") || "لا توجد منتجات";
        const html = [
            `🔔 <b>إشعار طلب إرجاع جديد</b>`, ``,
            `👤 الكاشير: <b>${escHtml(cashierName)}</b>`,
            `📄 رقم الفاتورة: <code>${escHtml(invoiceNumber)}</code>`,
            `📅 ${new Date().toLocaleDateString("ar-EG")}`, ``,
            `📦 <b>المنتجات:</b>`, itemsHtml, ``,
            `💰 مبلغ الاسترجاع: <b>${fmt(totalRefundAmount)} ج.م</b>`,
            `📝 السبب: ${escHtml(reason)}`, ``,
            `⏳ <b>قيد الانتظار — يتطلب موافقتك</b>`,
        ].join("\n");

        const result = await sendTelegramMessage(managerChatId, html);
        if (!result.ok)
            return res.status(200).json({ success: false, warning: true, error: result.error });

        res.status(200).json({ success: true, message: "✅ تم إرسال إشعار المرتجع" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ════════════════════════════════════════════════════════════════════════
// ✅ send-status-update
// ════════════════════════════════════════════════════════════════════════
export const sendReturnStatusUpdate = async (req, res) => {
    try {
        const { cashierChatId, returnDetails } = req.body;
        if (!cashierChatId || !returnDetails)
            return res.status(400).json({ success: false, error: "cashierChatId و returnDetails مطلوبان" });

        const {
            invoiceNumber = "N/A", status = "pending",
            totalRefundAmount = 0, approverName = "المدير", rejectionReason,
        } = returnDetails;

        const map = {
            approved: { e: "✅", t: "موافق عليه" },
            rejected: { e: "❌", t: "مرفوض" },
            pending: { e: "⏳", t: "قيد الانتظار" },
        };
        const { e, t } = map[status] ?? map.pending;
        const lines = [
            `${e} <b>تحديث حالة طلب الإرجاع</b>`, ``,
            `📄 رقم الفاتورة: <code>${escHtml(invoiceNumber)}</code>`,
            `🔴 الحالة: <b>${t}</b>`,
            `👤 المعالِج: ${escHtml(approverName)}`,
            `📅 ${new Date().toLocaleDateString("ar-EG")}`, ``,
            `💰 مبلغ الاسترجاع: <b>${fmt(totalRefundAmount)} ج.م</b>`,
        ];
        if (status === "rejected" && rejectionReason)
            lines.push(``, `📌 سبب الرفض: ${escHtml(rejectionReason)}`);
        if (status === "approved")
            lines.push(``, `✅ تم الموافقة على المبلغ`);

        const result = await sendTelegramMessage(cashierChatId, lines.join("\n"));
        if (!result.ok)
            return res.status(200).json({ success: false, warning: true, error: result.error });

        res.status(200).json({ success: true, message: "✅ تم إرسال تحديث الحالة" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ════════════════════════════════════════════════════════════════════════
// 📊 send-daily-report
//   Accepts: { managerPhone, dailyStats } OR { managerChatId, dailyStats }
// ════════════════════════════════════════════════════════════════════════
export const sendDailyReport = async (req, res) => {
    try {
        const { managerPhone, managerChatId, dailyStats } = req.body;
        if (!dailyStats)
            return res.status(400).json({ success: false, error: "dailyStats مطلوبة" });

        let resolvedChatId = null;
        let resolvedManagerName = "المدير";

        // ── resolve by phone ─────────────────────────────────────────────
        if (managerPhone) {
            const normalized = telegramBotService.normalizePhoneNumber(managerPhone);
            const user = await User.findOne({ phone: normalized });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: `لم يُعثر على مدير بالهاتف: ${normalized}`,
                    hint: "تأكد أن رقم الهاتف مسجَّل في النظام",
                });
            }

            if (!user.telegramChatId) {
                return res.status(400).json({
                    success: false,
                    error: `"${user.name}" لم يربط Telegram بعد`,
                    hint: `اطلب منه إرسال /start للبوت ثم اضغط "مشاركة رقم الهاتف"`,
                });
            }

            resolvedChatId = user.telegramChatId;
            resolvedManagerName = user.name;

            // ── direct chatId ────────────────────────────────────────────────
        } else if (managerChatId) {
            resolvedChatId = String(managerChatId);
        } else {
            return res.status(400).json({
                success: false,
                error: "يجب إرسال managerPhone أو managerChatId",
            });
        }

        const {
            totalSalesToday = 0, totalRevenue = 0,
            totalNetProfit = 0, avgTransactionValue = 0,
        } = dailyStats;

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

        const result = await sendTelegramMessage(resolvedChatId, html);
        if (!result.ok)
            return res.status(200).json({ success: false, warning: true, error: result.error });

        res.status(200).json({
            success: true,
            message: "✅ تم إرسال التقرير اليومي",
            sentTo: { chatId: resolvedChatId, name: resolvedManagerName }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ════════════════════════════════════════════════════════════════════════
// 📊 send-daily-report-to-all
//   اجعل هذا يعمل على جدول زمني (cron job) في الساعة 5 مساءً مثلاً
// ════════════════════════════════════════════════════════════════════════
export const sendDailyReportToAll = async (dailyStats) => {
    try {
        // جد جميع المدراء (المستخدمين الذين ربطوا Telegram)
        const managers = await User.find({
            telegramChatId: { $ne: null },
            role: { $in: ["manager", "admin", "owner"] }
        });

        if (managers.length === 0) {
            console.log("⚠️ [DailyReport] لا توجد مديرين مرتبطين بـ Telegram");
            return { success: false, error: "لا توجد مديرين" };
        }

        console.log(`📊 [DailyReport] إرسال التقرير إلى ${managers.length} مديرين...`);

        const {
            totalSalesToday = 0, totalRevenue = 0,
            totalNetProfit = 0, avgTransactionValue = 0,
        } = dailyStats;

        const pct = totalRevenue > 0 ? ((totalNetProfit / totalRevenue) * 100).toFixed(1) : "0";
        let perf = { e: "⚠️", t: "اليوم بحاجة لجهود تسويقية" };
        if (totalSalesToday > 100) perf = { e: "🚀", t: "يوم رائع! استمر بنفس الزخم" };
        else if (totalSalesToday > 50) perf = { e: "⬆️", t: "أداء جيد حتى الآن" };
        else if (totalSalesToday > 20) perf = { e: "📊", t: "أداء معقول، يمكن تحسينه" };

        const now = new Date();
        const html = [
            `📊 <b>تقرير البيع اليومي - تلقائي</b>`, ``,
            `📅 ${now.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}`,
            `⏰ ${now.toLocaleTimeString("ar-EG")}`, ``,
            `🛒 عدد المبيعات: <b>${totalSalesToday}</b> عملية`,
            `💵 إجمالي الإيرادات: <b>${fmt(totalRevenue)} ج.م</b>`,
            `💰 صافي الربح: <b>${fmt(totalNetProfit)} ج.م</b>`,
            `📈 نسبة الربح: <b>${pct}%</b>`,
            `📊 متوسط المعاملة: <b>${fmt(avgTransactionValue)} ج.م</b>`, ``,
            `────────────────────────────────`,
            `${perf.e} <b>تقييم الأداء:</b> ${perf.t}`, ``,
            `📌 تم إنشاء هذا التقرير تلقائياً الساعة ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`,
        ].join("\n");

        let sentCount = 0;
        let failedCount = 0;

        // أرسل للجميع
        for (const manager of managers) {
            const result = await sendTelegramMessage(manager.telegramChatId, html);
            if (result.ok) {
                sentCount++;
            } else {
                failedCount++;
                console.error(`❌ [DailyReport] فشل الإرسال إلى ${manager.name}: ${result.error}`);
            }
        }

        console.log(`✅ [DailyReport] تم الإرسال إلى ${sentCount} مديرين (فشل: ${failedCount})`);
        return { success: true, sentCount, failedCount, totalManagers: managers.length };

    } catch (err) {
        console.error("❌ [DailyReport] خطأ:", err.message);
        return { success: false, error: err.message };
    }
};

// Endpoint for manual trigger
export const triggerDailyReport = async (req, res) => {
    try {
        console.log("📊 [triggerDailyReport] Request received");
        console.log("📊 [triggerDailyReport] req.body:", req.body);

        // Safety check for undefined req.body
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({
                success: false,
                error: "Request body is empty or invalid",
                received: req.body
            });
        }

        // Accept both "dailyStats" and "stats" field names
        let dailyStats = req.body.dailyStats || req.body.stats;

        if (!dailyStats) {
            return res.status(400).json({
                success: false,
                error: "dailyStats (or stats) مطلوبة",
                bodyKeys: Object.keys(req.body)
            });
        }

        // Ensure avgTransactionValue is calculated
        if (!dailyStats.avgTransactionValue && dailyStats.totalSalesToday > 0) {
            dailyStats.avgTransactionValue = dailyStats.totalRevenue / dailyStats.totalSalesToday;
        }

        console.log("📊 [triggerDailyReport] Sending report with stats:", dailyStats);
        const result = await sendReportToAdmin(dailyStats);

        // Format response as user requested
        res.status(200).json({
            success: result.ok,
            message: result.ok
                ? "✅ تم تشغيل التقرير اليومي بنجاح وإرساله للإدارة"
                : result.error,
            stats: dailyStats,
            result: result
        });
    } catch (err) {
        console.error("❌ [triggerDailyReport] Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

// ════════════════════════════════════════════════════════════════════════
// 🤖 Webhook / Link / Status
// ════════════════════════════════════════════════════════════════════════
export const handleTelegramWebhook = async (req, res) => {
    try {
        await telegramBotService.processTelegramWebhook(req.body);
        res.status(200).json({ ok: true });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
};

export const linkUserToTelegram = async (req, res) => {
    try {
        const { userId, telegramChatId } = req.body;
        if (!userId || !telegramChatId)
            return res.status(400).json({ success: false, error: "userId و telegramChatId مطلوبان" });

        const user = await User.findByIdAndUpdate(
            userId,
            { telegramChatId: String(telegramChatId), telegramLinkedAt: new Date() },
            { new: true }
        );
        if (!user) return res.status(404).json({ success: false, error: "User not found" });

        res.status(200).json({ success: true, message: "✅ تم الربط بنجاح", user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const getTelegramLinkingStatus = async (req, res) => {
    try {
        const { phone } = req.query;
        if (!phone) return res.status(400).json({ error: "phone مطلوب" });

        const normalized = telegramBotService.normalizePhoneNumber(phone);
        const user = await User.findOne({ phone: normalized });
        if (!user) return res.status(404).json({ error: "User not found" });

        res.status(200).json({
            linked: !!user.telegramChatId,
            user: {
                id: user._id, name: user.name, phone: user.phone,
                telegramChatId: user.telegramChatId, linkedAt: user.telegramLinkedAt,
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ════════════════════════════════════════════════════════════════════════
// 📢 BULK BROADCAST - إرسال العروض والتخفيضات الجماعية
// ════════════════════════════════════════════════════════════════════════

/**
 * Helper: إرسال صورة مع نص (تصميم إعلاني)
 */
const sendPhotoMessage = async (chatId, imageUrl, caption) => {
    try {
        await axios.post(
            `${TELEGRAM_API_URL}/sendPhoto`,
            {
                chat_id: String(chatId),
                photo: imageUrl,
                caption: caption,
                parse_mode: "Markdown"
            },
            { timeout: 15000 }
        );
        console.log(`✅ [Broadcast Photo] → chat ${chatId}`);
        return { ok: true };
    } catch (err) {
        const detail = err.response?.data?.description ?? err.message;
        const code = err.response?.status ?? 0;
        console.error(`❌ [Broadcast Photo] chat ${chatId} (HTTP ${code}): ${detail}`);
        return { ok: false, error: `Telegram (${code}): ${detail}` };
    }
};

/**
 * Helper: إرسال نص فقط
 */
const sendTextMessage = async (chatId, text) => {
    try {
        await axios.post(
            `${TELEGRAM_API_URL}/sendMessage`,
            {
                chat_id: String(chatId),
                text: text,
                parse_mode: "Markdown"
            },
            { timeout: 15000 }
        );
        console.log(`✅ [Broadcast Text] → chat ${chatId}`);
        return { ok: true };
    } catch (err) {
        const detail = err.response?.data?.description ?? err.message;
        const code = err.response?.status ?? 0;
        console.error(`❌ [Broadcast Text] chat ${chatId} (HTTP ${code}): ${detail}`);
        return { ok: false, error: `Telegram (${code}): ${detail}` };
    }
};

/**
 * POST /api/telegram/send-bulk-broadcast
 * 
 * Request Body:
 * {
 *   "message": "النص الإعلاني مع دعم Markdown",
 *   "imageUrl": "https://example.com/poster.jpg" (اختياري)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "تم إرسال العرض بنجاح إلى X عميل من إجمالي Y",
 *   "results": {
 *     "total": Y,
 *     "sent": X,
 *     "failed": Z,
 *     "subscribers": [...]
 *   }
 * }
 */
export const sendBulkBroadcast = async (req, res) => {
    try {
        const { message, imageUrl } = req.body;

        // ✅ التحقق من البيانات المرسلة
        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                success: false,
                error: "الرسالة مطلوبة ويجب أن تكون نصاً غير فارغ"
            });
        }

        // 🔍 البحث عن جميع المشتركين المرتبطين بـ Telegram
        const subscribers = await User.find({
            telegramChatId: { $exists: true, $ne: null }
        });

        // ✅ التحقق من وجود مشتركين
        if (subscribers.length === 0) {
            return res.status(404).json({
                success: false,
                error: "لا يوجد عملاء مشتركين في البوت حالياً"
            });
        }

        console.log(`\n📢 [Broadcast] بدء إرسال الحملة إلى ${subscribers.length} عميل...`);
        console.log(`   الرسالة: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
        console.log(`   الصورة: ${imageUrl ? "نعم ✓" : "لا"}\n`);

        let sentCount = 0;
        let failedCount = 0;
        let failedSubscribers = [];

        // 📤 إرسال الرسالة لكل مشترك مع معالجة منفصلة للأخطاء
        for (const subscriber of subscribers) {
            try {
                let result;

                // إذا كان هناك صورة، أرسل صورة مع تعليق
                if (imageUrl && typeof imageUrl === "string" && imageUrl.trim()) {
                    result = await sendPhotoMessage(
                        subscriber.telegramChatId,
                        imageUrl.trim(),
                        message
                    );
                } else {
                    // وإلا، أرسل نص فقط
                    result = await sendTextMessage(
                        subscriber.telegramChatId,
                        message
                    );
                }

                // احسب النتائج
                if (result.ok) {
                    sentCount++;
                } else {
                    failedCount++;
                    failedSubscribers.push({
                        chatId: subscriber.telegramChatId,
                        name: subscriber.name,
                        phone: subscriber.phone,
                        error: result.error
                    });
                }

            } catch (innerError) {
                // معالجة أي خطأ غير متوقع في محاولة إرسال واحدة
                failedCount++;
                failedSubscribers.push({
                    chatId: subscriber.telegramChatId,
                    name: subscriber.name,
                    phone: subscriber.phone,
                    error: innerError.message
                });
                console.error(
                    `⚠️ [Broadcast] خطأ غير متوقع للعميل ${subscriber.name}:`,
                    innerError.message
                );
            }
        }

        console.log(`\n📢 [Broadcast] ✅ انتهت الحملة:`);
        console.log(`   تم الإرسال: ${sentCount}/${subscribers.length}`);
        console.log(`   فشل الإرسال: ${failedCount}/${subscribers.length}`);

        // 🎯 رد الاستجابة مع التفاصيل الكاملة
        res.status(200).json({
            success: true,
            message: `تم إرسال العرض بنجاح إلى ${sentCount} عميل من إجمالي ${subscribers.length}`,
            results: {
                total: subscribers.length,
                sent: sentCount,
                failed: failedCount,
                failureRate: failedCount > 0
                    ? `${((failedCount / subscribers.length) * 100).toFixed(1)}%`
                    : "0%",
                failedSubscribers: failedCount > 0 ? failedSubscribers : []
            }
        });

    } catch (err) {
        console.error("❌ [Broadcast] خطأ فادح:", err.message);
        res.status(500).json({
            success: false,
            error: err.message,
            hint: "حدث خطأ غير متوقع أثناء معالجة الحملة"
        });
    }
};

// ════════════════════════════════════════════════════════════════════════
// 📸 send-bulk-broadcast-with-file
//   رفع ملف صورة مباشرة إلى Cloudinary ثم البث الجماعي
//   
//   POST /api/telegram/send-bulk-broadcast-with-file
//   
//   Body (FormData):
//   - file: صورة (اختيارية)
//   - message: نص الحملة (مطلوب)
// ════════════════════════════════════════════════════════════════════════
export const sendBulkBroadcastWithFile = async (req, res) => {
    const uploadedFilePaths = [];

    try {
        const { message } = req.body;
        const file = req.file;

        // ✅ التحقق من البيانات
        if (!message || typeof message !== "string" || !message.trim()) {
            if (file) uploadedFilePaths.push(file.path);
            return res.status(400).json({
                success: false,
                error: "الرسالة مطلوبة ويجب أن تكون نصاً غير فارغ"
            });
        }

        let imageUrl = null;

        // 📤 رفع الصورة إلى Cloudinary إذا كانت موجودة
        if (file) {
            try {
                console.log(`📤 جاري رفع الصورة إلى Cloudinary...`);
                imageUrl = await uploadImageToCloudinary(file.path);
                uploadedFilePaths.push(file.path);
                console.log(`✅ تم الحصول على رابط الصورة: ${imageUrl}`);
            } catch (uploadError) {
                console.error(`❌ خطأ في رفع الصورة: ${uploadError.message}`);
                return res.status(400).json({
                    success: false,
                    error: `فشل رفع الصورة: ${uploadError.message}`
                });
            }
        }

        // 🔍 البحث عن جميع المشتركين
        const subscribers = await User.find({
            telegramChatId: { $exists: true, $ne: null }
        });

        // ✅ التحقق من وجود مشتركين
        if (subscribers.length === 0) {
            return res.status(404).json({
                success: false,
                error: "لا يوجد عملاء مشتركين في البوت حالياً"
            });
        }

        console.log(`\n📢 [Broadcast with File] بدء الحملة إلى ${subscribers.length} عميل...`);
        console.log(`   الرسالة: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
        console.log(`   الصورة: ${imageUrl ? "✓ نعم" : "✗ لا"}\n`);

        let sentCount = 0;
        let failedCount = 0;
        let failedSubscribers = [];

        // 📤 الإرسال لكل مشترك
        for (const subscriber of subscribers) {
            try {
                let result;

                if (imageUrl) {
                    result = await sendPhotoMessage(
                        subscriber.telegramChatId,
                        imageUrl,
                        message
                    );
                } else {
                    result = await sendTextMessage(
                        subscriber.telegramChatId,
                        message
                    );
                }

                if (result.ok) {
                    sentCount++;
                } else {
                    failedCount++;
                    failedSubscribers.push({
                        chatId: subscriber.telegramChatId,
                        name: subscriber.name,
                        phone: subscriber.phone,
                        error: result.error
                    });
                }

            } catch (innerError) {
                failedCount++;
                failedSubscribers.push({
                    chatId: subscriber.telegramChatId,
                    name: subscriber.name,
                    phone: subscriber.phone,
                    error: innerError.message
                });
                console.error(
                    `⚠️ [Broadcast] خطأ للعميل ${subscriber.name}:`,
                    innerError.message
                );
            }
        }

        console.log(`\n📢 [Broadcast] ✅ انتهت الحملة:`);
        console.log(`   تم الإرسال: ${sentCount}/${subscribers.length}`);
        console.log(`   فشل الإرسال: ${failedCount}/${subscribers.length}`);

        // ✅ النتيجة النهائية
        res.status(200).json({
            success: true,
            message: `تم إرسال العرض بنجاح إلى ${sentCount} عميل من إجمالي ${subscribers.length}`,
            results: {
                total: subscribers.length,
                sent: sentCount,
                failed: failedCount,
                failureRate: failedCount > 0
                    ? `${((failedCount / subscribers.length) * 100).toFixed(1)}%`
                    : "0%",
                imageUrl: imageUrl,
                failedSubscribers: failedCount > 0 ? failedSubscribers : []
            }
        });

    } catch (error) {
        console.error("❌ [Broadcast] خطأ فادح:", error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            hint: "حدث خطأ غير متوقع أثناء معالجة الحملة"
        });
    } finally {
        // 🗑️ تنظيف الملفات المؤقتة
        for (const filePath of uploadedFilePaths) {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️ تم حذف الملف المؤقت: ${filePath}`);
                }
            } catch (err) {
                console.error(`⚠️ خطأ في حذف الملف ${filePath}:`, err.message);
            }
        }
    }
};