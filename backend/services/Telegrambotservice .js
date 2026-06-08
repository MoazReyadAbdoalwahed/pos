import axios from "axios";
import User from "../models/userModel.js";
import crypto from "crypto";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8995727092:AAHP9Ju6ApVkMByfluI6jjc4nerKuuieZO4";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ════════════════════════════════════════════════════════════════════════
// 🛠️ UTILITIES
// ════════════════════════════════════════════════════════════════════════

const normalizePhoneNumber = (phone) => {
    if (!phone) return null;
    let cleaned = phone.toString().replace(/\D/g, "");
    if (cleaned.startsWith("20")) cleaned = "0" + cleaned.substring(2);
    else if (cleaned.startsWith("966")) cleaned = "0" + cleaned.substring(3);
    else if (!cleaned.startsWith("0")) cleaned = "0" + cleaned;
    return cleaned;
};

/**
 * 🔍 FLEXIBLE PHONE MATCHING
 * Generates multiple phone formats to match against database
 * Handles: +20 10 0492 7285, 01004927285, 201004927285, 1004927285, etc.
 */
const generatePhoneFormats = (rawPhone) => {
    if (!rawPhone) return { formats: [], primary: null };

    // Strip spaces, dashes, parentheses — keep digits and leading +
    let cleaned = rawPhone.toString().replace(/[\s\-\(\)]/g, "");

    // Track whether a + was present (one of the formats we'll store)
    const hadPlus = cleaned.startsWith("+");
    const digits = cleaned.replace(/^\+/, ""); // pure digits

    if (!digits) return { formats: [], primary: null };

    const formats = new Set();

    // Derive the canonical Egyptian local number (01xxxxxxxxx / 11 digits)
    let local;
    if (digits.startsWith("20") && digits.length === 12) {
        local = "0" + digits.substring(2);       // +201004927285 → 01004927285
    } else if (digits.startsWith("966") && digits.length === 12) {
        local = "0" + digits.substring(3);       // 966501234567 → 0501234567
    } else if (digits.startsWith("0") && digits.length === 11) {
        local = digits;                           // 01004927285  (already local)
    } else if (!digits.startsWith("0") && digits.length === 10) {
        local = "0" + digits;                    // 1004927285 → 01004927285
    } else {
        local = digits.startsWith("0") ? digits : "0" + digits;
    }

    const withoutZero = local.startsWith("0") ? local.substring(1) : local; // 1004927285
    const intl = "20" + withoutZero;                                   // 201004927285
    const intlPlus = "+" + intl;                                            // +201004927285

    formats.add(local);        // 01004927285  ← most common DB format
    formats.add(withoutZero);  // 1004927285
    formats.add(intl);         // 201004927285
    formats.add(intlPlus);     // +201004927285
    formats.add(digits);       // raw digits as received
    if (hadPlus) formats.add("+" + digits);

    return {
        formats: Array.from(formats),
        primary: local,
    };
};

/**
 * 🔎 SEARCH DATABASE WITH MULTIPLE FORMATS
 * Uses MongoDB $or query to find user by any phone format
 */
const findUserByPhoneAnyFormat = async (rawPhone) => {
    const { formats, primary } = generatePhoneFormats(rawPhone);

    console.log(`\n[PhoneSearch] Raw Input: "${rawPhone}"`);
    console.log(`[PhoneSearch] Primary Format: "${primary}"`);
    console.log(`[PhoneSearch] Searching with formats: [${formats.join(", ")}]`);

    if (formats.length === 0) {
        console.log(`[PhoneSearch] ❌ No valid formats generated`);
        return null;
    }

    try {
        // Build $or query with all formats
        const orConditions = formats.map(fmt => ({ phone: fmt }));
        const user = await User.findOne({ $or: orConditions });

        if (user) {
            console.log(`[PhoneSearch] ✅ Found user - Database phone: "${user.phone}"`);
            return user;
        } else {
            console.log(`[PhoneSearch] ❌ User not found with any format`);
            return null;
        }
    } catch (error) {
        console.error(`[PhoneSearch] ❌ Database error: ${error.message}`);
        return null;
    }
};

/**
 * 🆕 CREATE NEW CUSTOMER FROM TELEGRAM
 * Auto-creates customer account when they share phone via Telegram
 * Generates unique username and random password
 */
const createNewCustomerFromTelegram = async (phone, firstName, chatId) => {
    try {
        const { primary } = generatePhoneFormats(phone);

        if (!primary) {
            console.error(`[CreateCustomer] ❌ Could not generate primary phone format`);
            return null;
        }

        // ────────────────────────────────────────────────────────────
        // 1. Generate unique username from phone + random hash
        // ────────────────────────────────────────────────────────────
        const randomHash = crypto.randomBytes(4).toString("hex");
        const baseUsername = `telegram_${primary.replace(/\D/g, "")}`;
        const username = `${baseUsername}_${randomHash}`.substring(0, 30).toLowerCase();

        // ────────────────────────────────────────────────────────────
        // 2. Generate random password
        // ────────────────────────────────────────────────────────────
        const randomPassword = crypto.randomBytes(8).toString("hex");

        // ────────────────────────────────────────────────────────────
        // 3. Create user object
        // ────────────────────────────────────────────────────────────
        const newCustomer = new User({
            name: firstName || "New Customer",
            username: username,
            password: randomPassword,
            role: "customer",
            isActive: true,
            phone: primary,
            telegramChatId: chatId.toString(),
            telegramLinkedAt: new Date(),
        });

        // ────────────────────────────────────────────────────────────
        // 4. Save to database (password will be auto-hashed by pre-save hook)
        // ────────────────────────────────────────────────────────────
        await newCustomer.save();

        console.log(`\n[CreateCustomer] ✅ NEW CUSTOMER CREATED`);
        console.log(`[CreateCustomer]    Name: "${newCustomer.name}"`);
        console.log(`[CreateCustomer]    ID: ${newCustomer._id}`);
        console.log(`[CreateCustomer]    Phone: "${newCustomer.phone}"`);
        console.log(`[CreateCustomer]    Username: "${username}"`);
        console.log(`[CreateCustomer]    Chat ID: ${chatId}`);
        console.log(`[CreateCustomer]    Created At: ${newCustomer.createdAt}`);

        return newCustomer;

    } catch (error) {
        console.error(`\n[CreateCustomer] ❌ FAILED TO CREATE CUSTOMER`);
        console.error(`[CreateCustomer]    Error: ${error.message}`);

        // Check for specific error types
        if (error.code === 11000) {
            // Duplicate key error
            const field = Object.keys(error.keyPattern)[0];
            console.error(`[CreateCustomer]    Duplicate: ${field} already exists`);
        }

        return null;
    }
};

const sendTelegramMessage = async (chatId, text, replyMarkup = null) => {
    try {
        const payload = { chat_id: chatId, text, parse_mode: "HTML" };
        if (replyMarkup) payload.reply_markup = replyMarkup;

        console.log(`[SendMsg] Sending to chat ${chatId}...`);
        console.log(`[SendMsg] Token: ${BOT_TOKEN.substring(0, 10)}...${BOT_TOKEN.substring(BOT_TOKEN.length - 5)}`);
        console.log(`[SendMsg] API: ${TELEGRAM_API}/sendMessage`);

        const response = await axios.post(`${TELEGRAM_API}/sendMessage`, payload, { timeout: 10000 });

        // ✅ Verify the response is actually OK
        if (response.data && response.data.ok === true) {
            console.log(`✅ Message sent successfully to chat ${chatId}. Message ID: ${response.data.result.message_id}`);
            return response.data;
        } else {
            // ❌ Telegram API returned error
            const errorMsg = response.data?.description || "Unknown error";
            console.error(`❌ Telegram API error: ${errorMsg}`);
            console.error(`❌ Response:`, JSON.stringify(response.data, null, 2));
            throw new Error(`Telegram API: ${errorMsg}`);
        }
    } catch (error) {
        console.error(`❌ Error sending Telegram message to ${chatId}:`);
        console.error(`   Error message: ${error.message}`);
        if (error.response?.data) {
            console.error(`   Telegram response:`, JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
};

// ════════════════════════════════════════════════════════════════════════
// 🚨 LOW STOCK ALERT  
// ════════════════════════════════════════════════════════════════════════

/**
 * يُرسل تنبيه Telegram للمسؤول عندما يصل مخزون منتج إلى 1 أو 0
 * يتم استدعاؤه تلقائياً من salesController بعد كل عملية بيع
 */
export const sendLowStockAlert = async (product) => {
    try {
        // ── 1. تحقق من وجود TELEGRAM_ADMIN_CHAT_ID ──────────────────────
        const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

        console.log(`🔍 [LowStock] Checking alert for "${product?.name}"`);
        console.log(`   stock=${product?.stock} | adminChatId=${adminChatId || "NOT SET"}`);

        if (!adminChatId) {
            console.error(
                "❌ [LowStock] TELEGRAM_ADMIN_CHAT_ID is not set in .env!\n" +
                "   يجب إضافة هذا في ملف .env:\n" +
                "   TELEGRAM_ADMIN_CHAT_ID=1132207787"
            );
            return { ok: false, error: "TELEGRAM_ADMIN_CHAT_ID not set" };
        }

        // ── 2. لا ترسل إذا كان المخزون أكثر من 1 ────────────────────────
        if (product.stock > 1) {
            console.log(`ℹ️ [LowStock] stock=${product.stock} > 1, no alert needed`);
            return { ok: false, reason: "stock not low" };
        }

        // ── 3. بناء الرسالة ──────────────────────────────────────────────
        const stockEmoji = product.stock === 0 ? "🔴" : "🟡";
        const stockLabel = product.stock === 0
            ? "⛔ نفذ المخزون تماماً!"
            : "⚠️ قطعة واحدة متبقية فقط!";

        const alertMessage = `
🚨 <b>تنبيه: انخفاض المخزون</b>

${stockEmoji} <b>المنتج:</b> ${product.name}
🆔 <b>الكود:</b> <code>${product._id}</code>
📦 <b>المخزون الحالي:</b> <b>${product.stock}</b> — ${stockLabel}

⚠️ <i>يجب إعادة ملء المخزن في أقرب وقت!</i>
🕐 <i>${new Date().toLocaleString("ar-EG")}</i>
        `.trim();

        // ── 4. إرسال ─────────────────────────────────────────────────────
        await sendTelegramMessage(adminChatId, alertMessage);

        console.log(`✅ [LowStock] Alert sent! Product="${product.name}" stock=${product.stock} → chatId=${adminChatId}`);
        return { ok: true };

    } catch (error) {
        // لا نوقف عملية البيع أبداً بسبب خطأ في التنبيه
        console.error(`❌ [LowStock] Failed to send alert for "${product?.name}":`, error.message);
        return { ok: false, error: error.message };
    }
};

// ════════════════════════════════════════════════════════════════════════
// 🤖 BOT EVENT HANDLERS
// ════════════════════════════════════════════════════════════════════════

export const handleStartCommand = async (chatId) => {
    try {
        const welcomeMessage = `
👋 <b>أهلاً وسهلاً!</b>

مرحباً بك في بوت فواتيرنا 🛍️

لكي نتمكن من إرسال فواتيرك ومشترياتك تلقائياً، نحتاج إلى ربط حسابك.

⬇️ <b>يرجى مشاركة رقم هاتفك</b> لتفعيل هذه الخدمة
        `.trim();

        const keyboard = {
            keyboard: [[{ text: "📞 مشاركة رقم الهاتف", request_contact: true }]],
            resize_keyboard: true,
            one_time_keyboard: true,
        };

        await sendTelegramMessage(chatId, welcomeMessage, keyboard);
        console.log(`📨 /start command handled for chat ${chatId}`);
    } catch (error) {
        console.error("Error handling /start command:", error.message);
    }
};

export const handleContactEvent = async (chatId, phoneNumber, firstName) => {
    try {
        console.log(`\n${"═".repeat(80)}`);
        console.log(`[ContactEvent] 📱 CONTACT SHARED - SAVING CHAT_ID`);
        console.log(`${"═".repeat(80)}`);
        console.log(`   Chat ID:    ${chatId}`);
        console.log(`   Phone:      ${phoneNumber}`);
        console.log(`   First Name: ${firstName}`);

        // 🔍 Use flexible phone matching to find user
        let user = await findUserByPhoneAnyFormat(phoneNumber);

        // ─────────────────────────────────────────────────────────────────
        // If user NOT found → CREATE NEW CUSTOMER AUTOMATICALLY
        // ─────────────────────────────────────────────────────────────────
        if (!user) {
            console.log(`\n[ContactEvent] ❌ USER NOT FOUND`);
            console.log(`[ContactEvent] 🆕 AUTO-CREATING NEW CUSTOMER...`);

            user = await createNewCustomerFromTelegram(phoneNumber, firstName, chatId);

            if (!user) {
                console.error(`[ContactEvent] ❌ FAILED TO CREATE NEW CUSTOMER`);
                const errorMsg = `
❌ <b>حدث خطأ!</b>

عذراً، واجهنا مشكلة في إنشاء حسابك. يرجى المحاولة لاحقاً.
                `.trim();
                await sendTelegramMessage(chatId, errorMsg);
                return;
            }

            console.log(`[ContactEvent] ✅ NEW CUSTOMER AUTO-CREATED SUCCESSFULLY`);
        }

        // ✅ USER FOUND (or NEWLY CREATED) - ENSURE CHAT_ID IS SAVED
        console.log(`\n[ContactEvent] ✅ USER FOUND/CREATED`);
        console.log(`[ContactEvent]    Name: "${user.name}"`);
        console.log(`[ContactEvent]    ID: ${user._id}`);
        console.log(`[ContactEvent]    Phone in DB: "${user.phone}"`);

        // ⚠️ Use findByIdAndUpdate to avoid triggering password pre-save hook
        const linkedAt = new Date();
        await User.findByIdAndUpdate(
            user._id,
            { telegramChatId: chatId.toString(), telegramLinkedAt: linkedAt },
            { new: true }
        );

        console.log(`\n[ContactEvent] ✅ CHAT_ID SAVED TO DATABASE`);
        console.log(`[ContactEvent]    Chat ID: ${chatId}`);
        console.log(`[ContactEvent]    Saved At: ${linkedAt}`);

        const successMessage = `
✅ <b>تم الربط بنجاح!</b>

🎉 يا أهلاً <b>${firstName}</b>!

تم ربط حسابك بنجاح. ستصلك جميع فواتيرك ومشترياتك هنا مباشرة 📦

💡 <b>ماذا الآن؟</b>
• ستتلقى فواتير بيع فورية بعد كل عملية شراء
• سيتم إخطارك بحالة طلبات الإرجاع والمبالغ المستردة
• كل معاملاتك آمنة ومحفوظة لديك

شكراً لاستخدامك خدماتنا! 🙏
        `.trim();

        console.log(`[ContactEvent] Sending success message...`);
        await sendTelegramMessage(chatId, successMessage);

        console.log(`\n${"═".repeat(80)}`);
        console.log(`[ContactEvent] ✅ COMPLETE - CHAT_ID LINKED & SAVED`);
        console.log(`   User: "${user.name}" (ID: ${user._id})`);
        console.log(`   Phone: ${user.phone}`);
        console.log(`   Telegram: ${user.telegramChatId}`);
        console.log(`${"═".repeat(80)}\n`);

    } catch (error) {
        console.error(`\n${"═".repeat(80)}`);
        console.error(`[ContactEvent] ❌ ERROR`);
        console.error(`${"═".repeat(80)}`);
        console.error(`   Error: ${error.message}`);
        console.error(`   Stack: ${error.stack}`);
        console.error(`${"═".repeat(80)}\n`);

        try {
            await sendTelegramMessage(chatId, `❌ <b>حدث خطأ!</b>\n\nعذراً، حدثت مشكلة أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.`);
        } catch (err) {
            console.error(`[ContactEvent] ❌ Failed to send error message:`, err.message);
        }
    }
};

export const processTelegramWebhook = async (data) => {
    try {
        console.log(`\n[Webhook] Incoming request:`, JSON.stringify(data, null, 2));

        if (!data.message) {
            console.log("⚠️  [Webhook] No message in webhook data");
            return;
        }

        const { message } = data;
        const chatId = message.chat.id;
        const firstName = message.chat.first_name || "User";
        const text = message.text || "";
        const contact = message.contact;

        console.log(`\n[Webhook] ═══════════════════════════════════════════════════════════`);
        console.log(`[Webhook] Chat ID:      ${chatId}`);
        console.log(`[Webhook] First Name:   ${firstName}`);
        console.log(`[Webhook] Text:         ${text || "(no text)"}`);
        console.log(`[Webhook] Has Contact:  ${contact ? "✅ YES" : "❌ NO"}`);
        if (contact) {
            console.log(`[Webhook] Phone:        ${contact.phone_number}`);
        }
        console.log(`[Webhook] ═══════════════════════════════════════════════════════════\n`);

        if (text === "/start") {
            console.log(`[Webhook] → Processing /start command`);
            await handleStartCommand(chatId);
            console.log(`[Webhook] ✅ /start handled\n`);
            return;
        }

        if (contact && contact.phone_number) {
            console.log(`[Webhook] → Processing contact event`);
            await handleContactEvent(chatId, contact.phone_number, firstName);
            console.log(`[Webhook] ✅ Contact handled\n`);
            return;
        }

        if (text) {
            console.log(`[Webhook] → Regular text message, sending generic response`);
            await sendTelegramMessage(chatId, `
👋 شكراً على رسالتك!

أنا بوت تليجرام مخصص لإرسال فواتيرك.

💡 اضغط على /start لربط حسابك وتفعيل الخدمة
            `.trim());
            console.log(`[Webhook] ✅ Response sent\n`);
        }

    } catch (error) {
        console.error(`\n[Webhook] ❌ ERROR processing webhook:`);
        console.error(`   Message: ${error.message}`);
        console.error(`   Stack:   ${error.stack}\n`);
    }
};

export default {
    handleStartCommand,
    handleContactEvent,
    processTelegramWebhook,
    sendTelegramMessage,
    sendLowStockAlert,
    normalizePhoneNumber,
};