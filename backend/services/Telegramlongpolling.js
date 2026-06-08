/**
 * 🤖 Telegram Bot Long-Polling Service
 *
 * ⚠️  IMPORTANT: Use EITHER this long-polling service OR the webhook route
 *     — never both at the same time. They are mutually exclusive.
 *     For production, the webhook approach is preferred.
 *
 * Run standalone: node services/telegramLongPolling.js
 */

import axios from "axios";
import User from "../models/userModel.js";
import telegramBotService from "./Telegrambotservice .js";

// ✅ Fixed: removed hardcoded token fallback — must come from .env
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

if (!BOT_TOKEN) {
    console.error("❌ CRITICAL: TELEGRAM_BOT_TOKEN is not set in .env");
    process.exit(1);
}

let lastUpdateId = 0;
let isRunning = false;

console.log("═══════════════════════════════════════════════════════════════");
console.log("🤖 TELEGRAM LONG-POLLING SERVICE STARTING...");
console.log("═══════════════════════════════════════════════════════════════\n");

// ════════════════════════════════════════════════════════════════════════
// Fetch and process new updates from Telegram
// ════════════════════════════════════════════════════════════════════════
const pollForUpdates = async () => {
    try {
        const response = await axios.get(`${TELEGRAM_API}/getUpdates`, {
            params: {
                offset: lastUpdateId + 1,
                timeout: 30,
                allowed_updates: ["message"]
            },
            timeout: 35000
        });

        if (!response.data.ok) {
            console.error(`❌ Telegram API Error: ${response.data.description}`);
            return;
        }

        const updates = response.data.result || [];
        if (updates.length === 0) return;

        console.log(`📥 Received ${updates.length} new update(s)\n`);

        for (const update of updates) {
            lastUpdateId = Math.max(lastUpdateId, update.update_id);
            try {
                if (update.message) {
                    await processMessage(update.message);
                }
            } catch (error) {
                console.error(`❌ Error processing update ${update.update_id}:`, error.message);
            }
        }

    } catch (error) {
        if (error.code === "ECONNREFUSED") {
            console.error(`❌ Cannot connect to Telegram API. Check internet connection.`);
        } else if (error.code === "ETIMEDOUT") {
            return; // Expected with long-polling
        } else {
            console.error(`❌ Polling error: ${error.message}`);
        }
    }
};

// ════════════════════════════════════════════════════════════════════════
// Process individual message
// ════════════════════════════════════════════════════════════════════════
const processMessage = async (message) => {
    const chatId = message.chat?.id;
    const firstName = message.chat?.first_name || "User";
    const text = message.text?.trim() || "";
    const contact = message.contact;

    console.log(`[${new Date().toLocaleTimeString()}] 📨 Message from ${firstName} (Chat: ${chatId})`);

    if (text === "/start") {
        console.log(`   → Handling /start command`);
        try {
            await telegramBotService.handleStartCommand(chatId);
            console.log(`   ✅ /start processed\n`);
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}\n`);
        }
        return;
    }

    if (contact && contact.phone_number) {
        console.log(`   → Contact shared: ${contact.phone_number}`);
        try {
            await telegramBotService.handleContactEvent(chatId, contact.phone_number, firstName);
            console.log(`   ✅ Contact processed\n`);
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}\n`);
        }
        return;
    }

    if (text) {
        console.log(`   → Regular message: "${text}"`);
        const helpMessage = `
👋 شكراً على رسالتك!

أنا بوت تليجرام مخصص لإرسال فواتيرك والمشترياتك 📦

💡 الأوامر المتاحة:
/start — ربط حسابك وتفعيل الخدمة

لتفعيل الخدمة:
1️⃣ اضغط /start
2️⃣ مشارك رقم الهاتف
3️⃣ ستصلك الفواتير تلقائياً ✨
        `.trim();

        try {
            await telegramBotService.sendTelegramMessage(chatId, helpMessage);
            console.log(`   ✅ Help message sent\n`);
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}\n`);
        }
        return;
    }

    console.log(`   → Skipped: Unknown message type\n`);
};

// ════════════════════════════════════════════════════════════════════════
// Start the polling loop
// ════════════════════════════════════════════════════════════════════════
const startPolling = async () => {
    if (isRunning) {
        console.log("⚠️  Polling already running");
        return;
    }

    isRunning = true;
    console.log(`✅ Long-polling started. Listening for messages...\n`);

    const pollingLoop = async () => {
        while (isRunning) {
            await pollForUpdates();
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    };

    pollingLoop().catch(error => {
        console.error("Fatal polling error:", error);
        process.exit(1);
    });
};

const stopPolling = () => {
    console.log("\n🛑 Stopping telegram polling service...");
    isRunning = false;
    process.exit(0);
};

process.on("SIGINT", stopPolling);
process.on("SIGTERM", stopPolling);

startPolling();

export default {
    startPolling,
    stopPolling,
    isRunning: () => isRunning
};