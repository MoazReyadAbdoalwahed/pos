import express from "express";
import axiosInstance from "axios";
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
router.get("/get-updates", async (req, res) => {
    try {
        const r = await axiosInstance.get(`${TELEGRAM_API}/getUpdates`, { timeout: 8000 });
        const updates = r.data.result || [];
        const chats = updates
            .map((u) => ({
                chat_id: u.message?.chat?.id,
                username: u.message?.chat?.username,
                first_name: u.message?.chat?.first_name,
                text: u.message?.text,
            }))
            .filter((u) => u.chat_id);
        res.status(200).json({ success: true, count: chats.length, chats, hint: "استخدم chat_id الرقمي" });
    } catch (err) {
        res.status(502).json({ success: false, error: err.message });
    }
});

router.get("/test", async (req, res) => {
    try {
        const r = await axiosInstance.get(`${TELEGRAM_API}/getMe`, { timeout: 8000 });
        res.status(200).json({ success: true, bot: r.data.result });
    } catch (err) {
        res.status(502).json({ success: false, error: err.response?.data?.description ?? err.message });
    }
});

router.get("/test-stock-alert", async (req, res) => {
    try {
        const fakeProduct = { _id: "TEST-ID-123", name: "منتج اختبار روضة ", stock: 1 };
        const result = await sendLowStockAlert(fakeProduct);
        res.status(200).json({ success: result.ok, message: result.ok ? "✅ تم إرسال رسالة الاختبار" : "❌ فشل الإرسال" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ════════════════════════════════════════════════════════════════════════
// 👥 USER MANAGEMENT ROUTES
// ════════════════════════════════════════════════════════════════════════
router.get("/users", async (req, res) => {
    try {
        const users = await User.find({}, "name username phone telegramChatId telegramLinkedAt");
        res.status(200).json({ success: true, total: users.length, users });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/update-phone", async (req, res) => {
    try {
        const { userId, phone } = req.body;
        const user = await User.findByIdAndUpdate(userId, { phone }, { new: true });
        res.status(200).json({ success: true, user });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════════════
// 🤖 CORE TELEGRAM BOT ROUTES
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
router.post("/upload-image", upload.single("file"), telegramController.uploadImage);
router.post("/link-user", telegramController.linkUserToTelegram);
router.get("/status", telegramController.getTelegramLinkingStatus);

export default router;