import ReturnRequest from "../models/retunModel.js"; // تأكد من مطابقة اسم الملف لديك
import Sale from "../models/salesModel.js";
import Product from "../models/productsModel.js";
import mongoose from "mongoose";
import axios from "axios";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ════════════════════════════════════════════════════════════════════════
// 🔍 جلب تفاصيل الفاتورة للبحث عنها عند عمل المرتجع
// ════════════════════════════════════════════════════════════════════════
export const getInvoiceDetails = async (req, res) => {
    try {
        const { invoiceId } = req.params;

        if (!invoiceId) {
            return res.status(400).json({ message: "معرّف الفاتورة مطلوب" });
        }

        console.log(`🔍 Searching for invoice: ${invoiceId}`);

        // 1. البحث برقم الفاتورة أولاً (مثال: INV-123456)
        let invoice = await Sale.findOne({
            invoiceNumber: invoiceId,
            invoiceType: { $ne: "return" }
        }).populate("items.productId", "name stock wholesalePrice purchasePrice salePrice");

        // 2. إذا لم يجد، يبحث بالـ MongoDB ObjectId
        if (!invoice) {
            try {
                invoice = await Sale.findById(invoiceId)
                    .populate("items.productId", "name stock wholesalePrice purchasePrice salePrice");

                if (invoice && invoice.invoiceType === "return") {
                    invoice = null;
                }
            } catch (err) {
                console.log(`Invalid ObjectId format: ${invoiceId}`);
            }
        }

        if (!invoice) {
            return res.status(404).json({ message: `لم يتم العثور على الفاتورة: ${invoiceId}` });
        }

        // تحويل وتأكيد صياغة البيانات لتطابق متطلبات الفرونت إند
        const transformedInvoice = {
            ...invoice.toObject(),
            items: invoice.items.map(item => ({
                productId: item.productId ? (item.productId._id ? item.productId._id.toString() : item.productId.toString()) : item.productId,
                name: item.name,
                quantity: item.quantity,
                salesPrice: item.salesPrice || item.salePrice || 0,
                wholesalePrice: item.wholesalePrice || 0,
                totalItemPrice: item.totalItemPrice,
                priceType: item.priceType
            }))
        };

        res.status(200).json({
            message: "تم جلب بيانات الفاتورة بنجاح",
            data: transformedInvoice
        });
    } catch (error) {
        console.error(`Error fetching invoice: ${error.message}`);
        res.status(500).json({ message: "خطأ في جلب بيانات الفاتورة", error: error.message });
    }
};

// ════════════════════════════════════════════════════════════════════════
// 📝 كاشير يطلب عمل مرتجع (حالة معلقة)
// ════════════════════════════════════════════════════════════════════════
export const createReturnRequest = async (req, res) => {
    try {
        const { invoiceId, items, totalRefundAmount, reason } = req.body;

        // سحب معرف الكاشير تلقائياً من توكن التوثيق الحمي بالـ Middleware
        const cashierId = req.user?.userId || req.user?._id || req.user?.id;

        if (!cashierId) {
            return res.status(401).json({
                message: "لم يتم العثور على معلومات المستخدم. يرجى تسجيل الدخول مجددًا"
            });
        }

        if (!invoiceId || !items || items.length === 0 || !totalRefundAmount || !reason) {
            return res.status(400).json({ message: "جميع الحقول مطلوبة لإنشاء طلب المرتجع" });
        }

        const invoice = await Sale.findById(invoiceId);
        if (!invoice) {
            return res.status(404).json({ message: "الفاتورة الأصلية غير موجودة" });
        }

        // منع تكرار الطلبات المعلقة لنفس الفاتورة لضمان الحماية والرقابة المالية
        const existingReturn = await ReturnRequest.findOne({ invoiceId, status: "pending" });
        if (existingReturn) {
            return res.status(400).json({ message: "طلب مرتجع معلق بالفعل لهذه الفاتورة" });
        }

        const validatedItems = items.map(item => {
            const productIdStr = item.productId._id ? item.productId._id.toString() : item.productId.toString();
            return {
                productId: productIdStr,
                name: item.name || "",
                quantity: parseInt(item.quantity) || 0,
                price: parseFloat(item.salesPrice || item.price) || 0,
                wholesalePrice: parseFloat(item.wholesalePrice) || 0,
                totalItemPrice: parseFloat(item.totalItemPrice) || 0,
                priceType: item.priceType || "sale"
            };
        });

        // Validate all products exist before creating return request
        for (const item of validatedItems) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({
                    message: `المنتج ${item.name} غير موجود في النظام. تأكد من عدم حذفه قبل إنشاء طلب المرتجع`
                });
            }
        }

        // Validate and convert cashierId if it's a valid MongoDB ObjectId
        let validCashierId = null;
        if (mongoose.Types.ObjectId.isValid(cashierId)) {
            validCashierId = cashierId;
        }

        const returnRequest = new ReturnRequest({
            invoiceId,
            items: validatedItems,
            totalRefundAmount: parseFloat(totalRefundAmount),
            reason: reason.trim(),
            cashierId: validCashierId,
            status: "pending"
        });

        await returnRequest.save();

        res.status(201).json({
            message: "تم إنشاء طلب المرتجع بنجاح وهو في انتظار الموافقة من الإدارة",
            returnRequest
        });

    } catch (error) {
        res.status(500).json({ message: "خطأ في إنشاء طلب المرتجع", error: error.message });
    }
};

// ════════════════════════════════════════════════════════════════════════
// ✅ موافقة الأدمن على طلب المرتجع (الدالة الأصلية المستدعاة من السيرفر/التليجرام)
// ════════════════════════════════════════════════════════════════════════
export const approveReturn = async (req, res) => {
    try {
        const { id } = req.params;
        const { approvalNotes } = req.body;

        const approverId = req.user?.userId || req.user?._id || req.user?.id || "TELEGRAM_ADMIN";

        const result = await processApproveLogic(id, approverId, approvalNotes);

        if (!result.success) {
            return res.status(result.status).json({ message: result.message });
        }

        res.status(200).json({
            message: "تمت الموافقة على المرتجع، تحديث المخزن وإصدار الفاتورة المحاسبية بنجاح ↩️",
            returnRequest: result.returnRequest,
            invoice: result.invoice
        });
    } catch (error) {
        console.error(`❌ Error in approveReturn: ${error.message}`);
        res.status(500).json({ message: "خطأ في معالجة الموافقة مالياً", error: error.message });
    }
};

// Helper لمعالجة الحسابات والمخزن لعدم تكرار الكود بين التليجرام والـ HTTP API
const processApproveLogic = async (id, approverId, approvalNotes) => {
    if (!id) return { success: false, status: 400, message: "معرّف طلب المرتجع مطلوب" };

    const returnRequest = await ReturnRequest.findById(id).populate("invoiceId");
    if (!returnRequest) return { success: false, status: 404, message: "طلب المرتجع غير موجود" };
    if (returnRequest.status !== "pending") return { success: false, status: 400, message: `لا يمكن الموافقة على طلب مرتجع حالته: ${returnRequest.status}` };

    let totalReturnAmount = 0;
    let totalReturnCost = 0;
    const processedReturnItems = [];

    for (const item of returnRequest.items) {
        const product = await Product.findById(item.productId);
        if (!product) return { success: false, status: 404, message: `المنتج ${item.name} لم يعد متوفراً بالنظام، لا يمكن إتمام المرتجع` };

        product.stock += Number(item.quantity);
        await product.save();

        const itemReturnPrice = item.price * item.quantity;
        const itemReturnCost = (product.purchasePrice || 0) * item.quantity;

        totalReturnAmount += itemReturnPrice;
        totalReturnCost += itemReturnCost;

        processedReturnItems.push({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            salesPrice: item.price,
            wholesalePrice: item.wholesalePrice || 0,
            totalItemPrice: itemReturnPrice,
            priceType: item.priceType
        });
    }

    const netProfitImpact = -(totalReturnAmount - totalReturnCost);
    const returnInvoiceNumber = `RET-${Date.now().toString().slice(-6)}`;

    const newReturnInvoice = new Sale({
        invoiceNumber: returnInvoiceNumber,
        originalInvoiceNumber: returnRequest.invoiceId?.invoiceNumber || "UNKNOWN",
        items: processedReturnItems,
        totalAmount: -totalReturnAmount,
        totalCost: -totalReturnCost,
        netProfit: netProfitImpact,
        invoiceType: "return"
    });

    await newReturnInvoice.save();

    // Validate and convert approverId if it's a valid MongoDB ObjectId
    let validApproverId = null;
    if (approverId && mongoose.Types.ObjectId.isValid(approverId)) {
        validApproverId = approverId;
    }

    returnRequest.status = "approved";
    returnRequest.approverUserId = validApproverId;
    returnRequest.approvalDate = new Date();
    returnRequest.approvalNotes = approvalNotes ? approvalNotes.trim() : "تمت الموافقة من التليجرام وإصدار فاتورة مرتجع سالبة";
    await returnRequest.save();

    return { success: true, returnRequest, invoice: newReturnInvoice };
};

// ════════════════════════════════════════════════════════════════════════
// ❌ رفض طلب المرتجع
// ════════════════════════════════════════════════════════════════════════
export const rejectReturn = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;

        const rejecterId = req.user?.userId || req.user?._id || req.user?.id || "TELEGRAM_ADMIN";

        const result = await processRejectLogic(id, rejecterId, rejectionReason);
        if (!result.success) return res.status(result.status).json({ message: result.message });

        res.status(200).json({ message: "تم رفض طلب المرتجع وإغلاق الملف دون أي تعديل مالي", returnRequest: result.returnRequest });
    } catch (error) {
        res.status(500).json({ message: "خطأ في معالجة رفض طلب المرتجع", error: error.message });
    }
};

const processRejectLogic = async (id, rejecterId, rejectionReason) => {
    if (!id) return { success: false, status: 400, message: "معرّف الطلب مطلوب" };

    const returnRequest = await ReturnRequest.findById(id);
    if (!returnRequest) return { success: false, status: 404, message: "طلب المرتجع غير موجود" };
    if (returnRequest.status !== "pending") return { success: false, status: 400, message: "لا يمكن تعديل طلب مرتجع غير معلق" };

    // Validate and convert rejecterId if it's a valid MongoDB ObjectId
    let validRejecterId = null;
    if (rejecterId && rejecterId !== "TELEGRAM_ADMIN" && mongoose.Types.ObjectId.isValid(rejecterId)) {
        validRejecterId = rejecterId;
    }

    returnRequest.status = "rejected";
    returnRequest.approverUserId = validRejecterId;
    returnRequest.approvalDate = new Date();
    returnRequest.approvalNotes = rejectionReason ? rejectionReason.trim() : "تم الرفض بواسطة الإدارة عبر التليجرام";
    await returnRequest.save();

    return { success: true, returnRequest };
};

// ════════════════════════════════════════════════════════════════════════
// 📥 TELEGRAM CALLBACK QUERY HANDLER (معالجة أزرار التليجرام وتحديث المبيعات)
// ════════════════════════════════════════════════════════════════════════
export const handleReturnCallbackQuery = async (callbackQuery) => {
    const { id: callbackQueryId, message, data: cbData } = callbackQuery;
    const chatId = message.chat.id;
    const messageId = message.message_id;

    try {
        const isApprove = cbData.startsWith("return_approve:");
        const returnId = cbData.split(":")[1];

        let responseText = "";
        let updatedMessageText = message.text;

        if (isApprove) {
            // تنفيذ كود الموافقة، تعديل المخزن، وخصم الأرباح الصافية والإيرادات بقيم سالبة
            const result = await processApproveLogic(returnId, null, "تمت الموافقة فورا بضغط زر التليجرام");

            if (result.success) {
                responseText = "✅ تم قبول المرتجع وتعديل الحسابات والمخازن بنجاح!";
                updatedMessageText += `\n\n🟢 <b>الإجراء: تم القبول واعتماد الخصم المالي المرتجع بنجاح.</b>`;
            } else {
                responseText = `⚠️ فشل الإجراء: ${result.message}`;
                updatedMessageText += `\n\n❌ <b>فشل تنفيذ العملية: ${result.message}</b>`;
            }
        } else {
            // تنفيذ كود الرفض وإغلاق الملف دون تعديل مالي
            const result = await processRejectLogic(returnId, null, "تم الرفض بضغط زر التليجرام");

            if (result.success) {
                responseText = "❌ تم رفض طلب المرتجع وإغلاق الملف.";
                updatedMessageText += `\n\n🔴 <b>الإجراء: تم رفض هذا الطلب وإلغاؤه.</b>`;
            } else {
                responseText = `⚠️ فشل الإجراء: ${result.message}`;
                updatedMessageText += `\n\n❌ <b>فشل تنفيذ العملية: ${result.message}</b>`;
            }
        }

        // 1. إظهار رسالة منبثقة سريعة (Toast Notification) للمدير في تطبيق تليجرام
        await axios.post(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
            callback_query_id: callbackQueryId,
            text: responseText,
            show_alert: false
        }).catch(() => { });

        // 2. تحديث نص الرسالة الأصلية وحذف الأزرار ( reply_markup: {} ) لحماية الحسابات من الضغط المكرر
        await axios.post(`${TELEGRAM_API_URL}/editMessageText`, {
            chat_id: String(chatId),
            message_id: messageId,
            text: updatedMessageText,
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: [] } // مسح الأزرار تماماً للتأكيد والتحصين
        }).catch((err) => console.error("Error editing message text:", err.message));

    } catch (error) {
        console.error(`❌ [Telegram Callback Error]: ${error.message}`);
        await axios.post(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
            callback_query_id: callbackQueryId,
            text: "🚨 حدث خطأ داخلي في السيرفر أثناء معالجة الحسابات!",
            show_alert: true
        }).catch(() => { });
    }
};

// ════════════════════════════════════════════════════════════════════════
// ⏳ جلب الطلبات المعلقة للأدمن
// ════════════════════════════════════════════════════════════════════════
export const getPendingReturns = async (req, res) => {
    try {
        const pendingReturns = await ReturnRequest.find({ status: "pending" })
            .populate("invoiceId", "_id invoiceNumber totalAmount invoiceType")
            .populate("cashierId", "_id name username role")
            .sort({ createdAt: -1 });

        res.status(200).json({ message: "تم جلب الطلبات المعلقة بنجاح", data: pendingReturns });
    } catch (error) {
        res.status(500).json({ message: "خطأ في جلب المرتجعات المعلقة", error: error.message });
    }
};

// ════════════════════════════════════════════════════════════════════════
// 📜 جلب كامل سجل طلبات المرتجعات (المقبولة والمرفوضة)
// ════════════════════════════════════════════════════════════════════════
export const getReturnHistory = async (req, res) => {
    try {
        const returns = await ReturnRequest.find()
            .populate("invoiceId", "_id invoiceNumber totalAmount invoiceType")
            .populate("cashierId", "_id name username role")
            .populate("approverUserId", "_id name username role")
            .sort({ createdAt: -1 });

        res.status(200).json({ message: "تم جلب سجل المرتجعات", data: returns });
    } catch (error) {
        res.status(500).json({ message: "خطأ في جلب سجل المرتجعات", error: error.message });
    }
};