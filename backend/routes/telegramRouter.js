import express from "express";
import axios from "axios";
import * as telegramController from "../controllers/telegramController.js";
import upload from "../middlewares/upload.js";
import User from "../models/userModel.js";
import { sendLowStockAlert } from "../services/Telegrambotservice .js";

const router = express.Router();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8995727092:AAHP9Ju6ApVkMByfluI6jjc4nerKuuieZO4";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ════════════════════════════════════════════════════════════════════════
// 🔍  DEBUG / SETUP HELPERS
// ════════════════════════════════════════════════════════════════════════

/** GET /api/telegram/get-updates */
router.get("/get-updates", async (req, res) => {
    try {
        const r = await axios.get(`${TELEGRAM_API}/getUpdates`, { timeout: 8000 });
        const updates = r.data.result || [];
        const chats = updates
            .map((u) => ({
                chat_id: u.message?.chat?.id,
                username: u.message?.chat?.username,
                first_name: u.message?.chat?.first_name,
                text: u.message?.text,
            }))
            .filter((u) => u.chat_id);
        res.status(200).json({ success: true, count: chats.length, chats, hint: "استخدم chat_id (الرقم) وليس username" });
    } catch (err) {
        res.status(502).json({ success: false, error: err.message });
    }
});

/** GET /api/telegram/test */
router.get("/test", async (req, res) => {
    try {
        const r = await axios.get(`${TELEGRAM_API}/getMe`, { timeout: 8000 });
        res.status(200).json({ success: true, bot: r.data.result });
    } catch (err) {
        res.status(502).json({ success: false, error: err.response?.data?.description ?? err.message });
    }
});

// ════════════════════════════════════════════════════════════════════════
// 🧪 TEST LOW STOCK ALERT  ← جديد: لاختبار تنبيه المخزون مباشرة
//    GET /api/telegram/test-stock-alert
// ════════════════════════════════════════════════════════════════════════
router.get("/test-stock-alert", async (req, res) => {
    try {
        console.log("🧪 [TestAlert] Manual test triggered...");
        console.log(`   TELEGRAM_ADMIN_CHAT_ID = ${process.env.TELEGRAM_ADMIN_CHAT_ID || "NOT SET ❌"}`);
        console.log(`   TELEGRAM_BOT_TOKEN     = ${process.env.TELEGRAM_BOT_TOKEN ? "SET ✅" : "NOT SET ❌"}`);

        // منتج وهمي بمخزون = 1 للاختبار
        const fakeProduct = {
            _id: "TEST-ID-123",
            name: "منتج اختبار — Elmo Combs",
            stock: 1,
        };

        const result = await sendLowStockAlert(fakeProduct);

        res.status(200).json({
            success: result.ok,
            result,
            env: {
                TELEGRAM_ADMIN_CHAT_ID: process.env.TELEGRAM_ADMIN_CHAT_ID || "❌ NOT SET",
                TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ? "✅ SET" : "❌ NOT SET",
            },
            message: result.ok
                ? "✅ تم إرسال رسالة الاختبار! تحقق من Telegram الآن."
                : `❌ فشل الإرسال: ${result.error || result.reason}`,
        });
    } catch (err) {
        console.error("❌ [TestAlert] Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 📸 UPLOAD IMAGE
router.post("/upload-image", upload.single("file"), telegramController.uploadImage);

/** GET /api/telegram/users */
router.get("/users", async (req, res) => {
    try {
        const users = await User.find({}, "name username phone telegramChatId telegramLinkedAt");
        res.status(200).json({ success: true, total: users.length, users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** GET /api/telegram/users-for-invoice */
router.get("/users-for-invoice", async (req, res) => {
    try {
        const users = await User.find({ telegramChatId: { $ne: null } }, "name username phone telegramChatId");
        res.status(200).json({ success: true, linkedCount: users.length, users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** POST /api/telegram/update-phone */
router.post("/update-phone", async (req, res) => {
    try {
        const { userId, phone } = req.body;
        if (!userId || !phone) return res.status(400).json({ error: "userId و phone مطلوبان" });
        const user = await User.findByIdAndUpdate(userId, { phone }, { new: true, runValidators: true });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.status(200).json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ════════════════════════════════════════════════════════════════════════
// 🤖  BOT ROUTES
// ════════════════════════════════════════════════════════════════════════
router.post("/webhook", telegramController.handleTelegramWebhook);
router.post("/send-invoice", telegramController.sendInvoiceByPhone);
router.post("/send-invoice-notification", telegramController.sendInvoiceNotification);
router.post("/send-return-alert", telegramController.sendReturnAlert);
router.post("/send-status-update", telegramController.sendReturnStatusUpdate);
router.post("/send-daily-report", telegramController.sendDailyReport);
router.post("/trigger-daily-report", telegramController.triggerDailyReport);
router.post("/send-bulk-broadcast", telegramController.sendBulkBroadcast);
router.post("/send-bulk-broadcast-with-file", upload.single("file"), telegramController.sendBulkBroadcastWithFile);
router.post("/upload-image", upload.single("file"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "لا يوجد ملف مرفوع" });
        }

        // Return the file path that can be accessed by frontend
        const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        res.status(200).json({
            success: true,
            message: "تم رفع الصورة بنجاح",
            imageUrl: imageUrl,
            filename: req.file.filename
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ success: false, message: error.message || "خطأ في رفع الملف" });
    }
});
router.post("/link-user", telegramController.linkUserToTelegram);
router.get("/status", telegramController.getTelegramLinkingStatus);

export default router;