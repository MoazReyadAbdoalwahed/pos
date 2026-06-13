import axios from "axios";
import User from "../models/userModel.js";
import telegramBotService from "../services/Telegrambotservice .js";
import { sendReportToAdmin } from "../services/Dailyreportscheduler.js";
import { uploadImageToCloudinary } from "../services/cloudinaryService.js";
import { handleReturnCallbackQuery } from "../controllers/returnController.js";
import fs from "fs";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "your_bot_token_here";
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

if (!BOT_TOKEN || BOT_TOKEN === "your_bot_token_here") {
    console.error("❌ CRITICAL: TELEGRAM_BOT_TOKEN is not set in .env file!");
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
// ════════════════════════════════════════════════════════════════════════
export const uploadImage = async (req, res) => {
    const uploadedFilePaths = [];
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ success: false, error: "لم يتم تحديد ملف" });

        const imageUrl = await uploadImageToCloudinary(file.path);
        uploadedFilePaths.push(file.path);

        res.status(200).json({ success: true, message: "تم رفع الصورة بنجاح", imageUrl });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message || "فشل رفع الصورة" });
    } finally {
        for (const filePath of uploadedFilePaths) {
            try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { /* ignore */ }
        }
    }
};

// ════════════════════════════════════════════════════════════════════════
// 📤 Core Telegram Message Senders
// ════════════════════════════════════════════════════════════════════════
const sendTelegramMessage = async (chatId, html, replyMarkup = null) => {
    if (!BOT_TOKEN) return { ok: false, error: "TELEGRAM_BOT_TOKEN not configured" };
    if (!chatId || !html) return { ok: false, error: "chatId or html missing" };

    try {
        const body = {
            chat_id: String(chatId),
            text: html,
            parse_mode: "HTML"
        };
        if (replyMarkup) body.reply_markup = replyMarkup;

        await axios.post(`${TELEGRAM_API_URL}/sendMessage`, body, { timeout: 12000 });
        return { ok: true };
    } catch (err) {
        const detail = err.response?.data?.description ?? err.message;
        const code = err.response?.status ?? err.code ?? "UNKNOWN";
        console.error(`❌ [Telegram] Failed to send to chat ${chatId} — ${code}: ${detail}`);
        return { ok: false, error: `Telegram (${code}): ${detail}`, chatId, code };
    }
};

const sendTextMessage = async (chatId, text) => {
    try {
        await axios.post(
            `${TELEGRAM_API_URL}/sendMessage`,
            { chat_id: String(chatId), text: text, parse_mode: "Markdown" },
            { timeout: 15000 }
        );
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err.response?.data?.description ?? err.message };
    }
};

const sendPhotoMessage = async (chatId, imageUrl, caption) => {
    try {
        await axios.post(
            `${TELEGRAM_API_URL}/sendPhoto`,
            { chat_id: String(chatId), photo: imageUrl, caption, parse_mode: "HTML" },
            { timeout: 15000 }
        );
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err.response?.data?.description ?? err.message };
    }
};

// ════════════════════════════════════════════════════════════════════════
// 🔄 WEBHOOK (إدارة رسائل البوت ونقرات الأزرار التفاعلية للمرتجعات)
// ════════════════════════════════════════════════════════════════════════
export const handleTelegramWebhook = async (req, res) => {
    res.sendStatus(200); // الرد الفوري لتليجرام لمنع تكرار إرسال الـ Request
    const data = req.body;

    try {
        // 🔘 معالجة ضغط أزرار القبول والرفض من تليجرام
        if (data.callback_query) {
            const cq = data.callback_query;
            const cbData = cq.data || "";

            // شرط الحماية والتحقق: التأكد من أن الضاغط هو المدير الفعلي للسيستم
            const senderChatId = String(cq.from?.id);
            const managerChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

            if (managerChatId && senderChatId !== managerChatId) {
                await axios.post(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
                    callback_query_id: cq.id,
                    text: "⚠️ عذراً، ليس لديك صلاحية اتخاذ إجراء على هذا الطلب!",
                    show_alert: true
                }).catch(() => { });
                return;
            }

            // إذا كان هو المدير، مرر البيانات فوراً لمتحكم المرتجعات لتحديث الحسابات والمخزن
            if (cbData.startsWith("return_approve:") || cbData.startsWith("return_reject:")) {
                await handleReturnCallbackQuery(cq);
                return;
            }

            // إغلاق علامة التحميل الدوارة لأي أزرار أخرى
            await axios.post(
                `${TELEGRAM_API_URL}/answerCallbackQuery`,
                { callback_query_id: cq.id },
                { timeout: 5000 }
            ).catch(() => { });
            return;
        }

        // 💬 الرسائل النصية العادية الموجهة للبوت
        if (data.message) {
            await telegramBotService.processTelegramWebhook(data);
        }
    } catch (error) {
        console.error(`❌ [Webhook] Error: ${error.message}`);
    }
};

// ════════════════════════════════════════════════════════════════════════
// 📄 send-invoice
// ════════════════════════════════════════════════════════════════════════
export const sendInvoiceByPhone = async (req, res) => {
    try {
        const { phone, chatId } = req.body;
        const invoiceDetails = req.body.invoiceDetails || req.body.invoice;

        if (!invoiceDetails) return res.status(400).json({ success: false, error: "invoiceDetails مطلوبة" });

        let resolvedChatId = null;
        let resolvedUserName = "العميل";

        if (phone) {
            const normalized = telegramBotService.normalizePhoneNumber(phone);
            const user = await User.findOne({ phone: normalized });
            if (!user) return res.status(404).json({ success: false, error: `لم يُعثر على مستخدم بالهاتف: ${normalized}` });
            if (!user.telegramChatId) return res.status(200).json({ success: false, warning: true, error: `"${user.name}" لم يربط Telegram بعد`, needsLink: true });
            resolvedChatId = user.telegramChatId;
            resolvedUserName = user.name;
        } else if (chatId) {
            resolvedChatId = String(chatId).trim();
        } else {
            return res.status(400).json({ success: false, error: "يجب إرسال phone أو chatId" });
        }

        const { invoiceNumber = "N/A", items = [], totalAmount = 0, paidAmount = 0, remainingAmount = 0 } = invoiceDetails;
        const itemsHtml = items.length
            ? items.map((i) => {
                const price = i.salePrice || i.price || 0;
                return `• <b>${escHtml(i.name)}</b> — ${i.quantity} × ${fmt(price)} = <b>${fmt(i.quantity * price)} ج.م</b>`;
            }).join("\n")
            : "لا توجد منتجات";

        const html = [
            `✅ <b>فاتورة مبيعات</b>`, ``,
            `🔖 رقم الفاتورة: <code>${escHtml(invoiceNumber)}</code>`,
            `👤 العميل: <b>${escHtml(resolvedUserName)}</b>`,
            `📅 ${new Date().toLocaleDateString("ar-EG")}  ⏰ ${new Date().toLocaleTimeString("ar-EG")}`,
            ``, `📦 <b>المنتجات:</b>`, itemsHtml, ``,
            `────────────────────────`,
            `💵 الإجمالي: <b>${fmt(totalAmount)} ج.م</b>`,
            `✅ المدفوع:  <b>${fmt(paidAmount)} ج.m</b>`,
            `⏳ Mتبقي:  <b>${fmt(remainingAmount)} ج.م</b>`,
            ``, `🎯 شكراً لك على الشراء!`,
        ].join("\n");

        const result = await sendTelegramMessage(resolvedChatId, html);
        if (!result.ok) return res.status(200).json({ success: false, warning: true, error: result.error });

        res.status(200).json({ success: true, message: "✅ تم إرسال الفاتورة عبر Telegram", sentTo: { chatId: resolvedChatId, name: resolvedUserName } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const sendInvoiceNotification = sendInvoiceByPhone;

// ════════════════════════════════════════════════════════════════════════
// 🔄 send-return-alert (إرسال إشعار المرتجع للمدير مع الأزرار التفاعلية)
// ════════════════════════════════════════════════════════════════════════
export const sendReturnAlert = async (req, res) => {
    try {
        const { managerChatId, returnRequest } = req.body;
        if (!managerChatId || !returnRequest)
            return res.status(400).json({ success: false, error: "managerChatId و returnRequest مطلوبان" });

        const { _id: returnId, invoiceNumber = "N/A", cashierName = "كاشير", returnItems = [], totalRefundAmount = 0, reason = "" } = returnRequest;
        const itemsHtml = returnItems.map((i) => `• ${escHtml(i.name)} — ${i.quantity} قطعة`).join("\n") || "لا توجد منتجات";

        const html = [
            `🔔 <b>إشعار طلب إرجاع جديد</b>`, ``,
            `👤 الكاشير: <b>${escHtml(cashierName)}</b>`,
            `📄 رقم الفاتورة: <code>${escHtml(invoiceNumber)}</code>`,
            `📅 ${new Date().toLocaleDateString("ar-EG")}`, ``,
            `📦 <b>المنتجات:</b>`, itemsHtml, ``,
            `💰 مبلغ الاسترجاع: <b>${fmt(totalRefundAmount)} ج.م</b>`,
            `📝 السبب: ${escHtml(reason)}`, ``,
            `⏳ <b>يتطلب اتخاذ إجراء فوري منك:</b>`,
        ].join("\n");

        // بناء الأزرار التفاعلية لحمل الـ ID الخاص بعملية الارتجاع
        const inlineKeyboard = {
            inline_keyboard: [
                [
                    { text: "✅ قبول واعتماد", callback_data: `return_approve:${returnId}` },
                    { text: "❌ رفض الطلب", callback_data: `return_reject:${returnId}` }
                ]
            ]
        };

        const result = await sendTelegramMessage(managerChatId, html, inlineKeyboard);
        if (!result.ok) return res.status(200).json({ success: false, warning: true, error: result.error });
        res.status(200).json({ success: true, message: "✅ تم إرسال إشعار المرتجع مع الأزرار التفاعلية بنجاح" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ════════════════════════════════════════════════════════════════════════
// ✅ send-status-update (إشعار الكاشير بعد اتخاذ القرار)
// ════════════════════════════════════════════════════════════════════════
export const sendReturnStatusUpdate = async (req, res) => {
    try {
        const { cashierChatId, returnDetails } = req.body;
        if (!cashierChatId || !returnDetails)
            return res.status(400).json({ success: false, error: "cashierChatId و returnDetails مطلوبان" });

        const { invoiceNumber = "N/A", status = "pending", totalRefundAmount = 0, approverName = "المدير", rejectionReason } = returnDetails;
        const map = { approved: { e: "✅", t: "موافق عليه" }, rejected: { e: "❌", t: "مرفوض" }, pending: { e: "⏳", t: "قيد الانتظار" } };
        const { e, t } = map[status] ?? map.pending;

        const lines = [
            `${e} <b>تحديث حالة طلب الإرجاع</b>`, ``,
            `📄 رقم الفاتورة: <code>${escHtml(invoiceNumber)}</code>`,
            `🔴 الحالة: <b>${t}</b>`,
            `👤 المعالِج: ${escHtml(approverName)}`,
            `📅 ${new Date().toLocaleDateString("ar-EG")}`, ``,
            `💰 مبلغ الاسترجاع: <b>${fmt(totalRefundAmount)} ج.م</b>`,
        ];
        if (status === "rejected" && rejectionReason) lines.push(``, `📌 سبب الرفض: ${escHtml(rejectionReason)}`);
        if (status === "approved") lines.push(``, `✅ تم تسوية الأرباح والمبيعات والمخزن تلقائياً`);

        const result = await sendTelegramMessage(cashierChatId, lines.join("\n"));
        if (!result.ok) return res.status(200).json({ success: false, warning: true, error: result.error });
        res.status(200).json({ success: true, message: "✅ تم إرسال تحديث الحالة إلى الكاشير" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ════════════════════════════════════════════════════════════════════════
// 📊 send-daily-report & trigger-daily-report
// ════════════════════════════════════════════════════════════════════════
export const sendDailyReport = async (req, res) => {
    try {
        const { managerPhone, managerChatId, dailyStats } = req.body;
        if (!dailyStats) return res.status(400).json({ success: false, error: "dailyStats مطلوبة" });

        let resolvedChatId = null;
        let resolvedManagerName = "المدير";

        if (managerPhone) {
            const normalized = telegramBotService.normalizePhoneNumber(managerPhone);
            const user = await User.findOne({ phone: normalized });
            if (!user) return res.status(404).json({ success: false, error: `لم يُعثر على مدير بالهاتف: ${normalized}` });
            if (!user.telegramChatId) return res.status(400).json({ success: false, error: `"${user.name}" لم يربط Telegram بعد` });
            resolvedChatId = user.telegramChatId;
            resolvedManagerName = user.name;
        } else if (managerChatId) {
            resolvedChatId = String(managerChatId);
        } else {
            return res.status(400).json({ success: false, error: "يجب إرسال managerPhone أو managerChatId" });
        }

        const { totalSalesToday = 0, totalRevenue = 0, totalNetProfit = 0, avgTransactionValue = 0 } = dailyStats;
        const pct = totalRevenue > 0 ? ((totalNetProfit / totalRevenue) * 100).toFixed(1) : "0";
        let perf = { e: "⚠️", t: "اليوم بحاجة لجهود تسويقية" };
        if (totalSalesToday > 100) perf = { e: "🚀", t: "يوم رائع!" };
        else if (totalSalesToday > 50) perf = { e: "⬆️", t: "أداء جيد" };
        else if (totalSalesToday > 20) perf = { e: "📊", t: "أداء معقول" };

        const now = new Date();
        const html = [
            `📊 <b>تقرير البيع اليومي</b>`, ``,
            `📅 ${now.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}`,
            `⏰ ${now.toLocaleTimeString("ar-EG")}`, ``,
            `🛒 عدد المبيعات: <b>${totalSalesToday}</b>`,
            `💵 إجمالي الإيرادات: <b>${fmt(totalRevenue)} ج.م</b>`,
            `💰 صافي الربح: <b>${fmt(totalNetProfit)} ج.م</b>`,
            `📈 نسبة الربح: <b>${pct}%</b>`,
            `📊 متوسط المعاملة: <b>${fmt(avgTransactionValue)} ج.م</b>`, ``,
            `────────────────────────────────`,
            `${perf.e} <b>تقييم الأداء:</b> ${perf.t}`, ``,
            `📌 تم إنشاء هذا التقرير تلقائياً`,
        ].join("\n");

        const result = await sendTelegramMessage(resolvedChatId, html);
        if (!result.ok) return res.status(200).json({ success: false, warning: true, error: result.error });

        res.status(200).json({ success: true, message: "✅ تم إرسال التقرير اليومي", sentTo: { chatId: resolvedChatId, name: resolvedManagerName } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const triggerDailyReport = async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                error: "فشل الإرسال: الـ Request Body فارغ! يجب إرسال كائن dailyStats يحتوي على البيانات الحالية لكي يعمل الـ Trigger."
            });
        }

        let dailyStats = req.body.dailyStats || req.body.stats;
        if (!dailyStats) {
            return res.status(400).json({ success: false, error: "حقل dailyStats أو stats مطلوب في الـ Body" });
        }

        const result = await sendReportToAdmin(dailyStats);
        res.status(200).json({ success: result.ok, result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ════════════════════════════════════════════════════════════════════════
// 📢 BROADCAST
// ════════════════════════════════════════════════════════════════════════
export const sendBulkBroadcast = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message?.trim()) return res.status(400).json({ success: false, error: "الرسالة مطلوبة" });

        const subscribers = await User.find({ telegramChatId: { $exists: true, $ne: null } });
        if (subscribers.length === 0) return res.status(404).json({ success: false, error: "لا يوجد مشتركين" });

        let sentCount = 0, failedCount = 0, failedSubscribers = [];

        for (const sub of subscribers) {
            const result = await sendTextMessage(sub.telegramChatId, message);
            if (result.ok) {
                sentCount++;
            } else {
                failedCount++;
                failedSubscribers.push({ chatId: sub.telegramChatId, name: sub.name, error: result.error });
            }
        }

        res.status(200).json({
            success: true,
            message: `تم الإرسال إلى ${sentCount} من ${subscribers.length}`,
            results: { total: subscribers.length, sent: sentCount, failed: failedCount, failedSubscribers },
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const sendBulkBroadcastWithFile = async (req, res) => {
    const uploadedFilePaths = [];
    try {
        const { message } = req.body;
        const file = req.file;

        if (!message?.trim()) {
            if (file) uploadedFilePaths.push(file.path);
            return res.status(400).json({ success: false, error: "الرسالة مطلوبة" });
        }

        let imageUrl = null;
        if (file) {
            imageUrl = await uploadImageToCloudinary(file.path);
            uploadedFilePaths.push(file.path);
        }

        const subscribers = await User.find({ telegramChatId: { $exists: true, $ne: null } });
        if (subscribers.length === 0) return res.status(404).json({ success: false, error: "لا يوجد مشتركين" });

        let sentCount = 0, failedCount = 0, failedSubscribers = [];

        for (const sub of subscribers) {
            const result = imageUrl
                ? await sendPhotoMessage(sub.telegramChatId, imageUrl, message)
                : await sendTextMessage(sub.telegramChatId, message);

            if (result.ok) {
                sentCount++;
            } else {
                failedCount++;
                failedSubscribers.push({ chatId: sub.telegramChatId, name: sub.name, error: result.error });
            }
        }

        res.status(200).json({
            success: true,
            message: `تم الإرسال إلى ${sentCount} من ${subscribers.length}`,
            results: { total: subscribers.length, sent: sentCount, failed: failedCount, imageUrl, failedSubscribers },
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        for (const filePath of uploadedFilePaths) {
            try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { /* ignore */ }
        }
    }
};

export const linkUserToTelegram = async (req, res) => {
    try {
        const { userId, telegramChatId } = req.body;
        if (!userId || !telegramChatId) return res.status(400).json({ success: false, error: "userId و telegramChatId مطلوبان" });

        const user = await User.findByIdAndUpdate(
            userId,
            { telegramChatId: String(telegramChatId), telegramLinkedAt: new Date() },
            { new: true }
        );
        if (!user) return res.status(404).json({ success: false, error: "User not found" });

        res.status(200).json({ success: true, message: "✅ تم ربط Telegram بنجاح", user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const getTelegramLinkingStatus = async (req, res) => {
    try {
        const total = await User.countDocuments();
        const linked = await User.countDocuments({ telegramChatId: { $ne: null } });
        res.status(200).json({ success: true, total, linked, unlinked: total - linked });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};