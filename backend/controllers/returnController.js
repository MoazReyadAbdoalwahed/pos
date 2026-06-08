import ReturnRequest from "../models/retunModel.js"; // تأكد من مطابقة اسم الملف لديك
import Sale from "../models/salesModel.js";
import Product from "../models/productsModel.js";

/**
 * 🔍 جلب تفاصيل الفاتورة للبحث عنها عند عمل المرتجع
 */
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
                productId: item.productId._id ? item.productId._id.toString() : item.productId.toString(),
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

/**
 * 📝 كاشير يطلب عمل مرتجع (حالة معلقة)
 */
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

        const returnRequest = new ReturnRequest({
            invoiceId,
            items: validatedItems,
            totalRefundAmount: parseFloat(totalRefundAmount),
            reason: reason.trim(),
            cashierId: cashierId,
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

/**
 * ✅ موافقة الأدمن على طلب المرتجع -> يؤدي إلى إنشاء فاتورة مبيعات سالبة في جدول Sale تلقائياً
 */
export const approveReturn = async (req, res) => {
    try {
        const { id } = req.params; // تم تأكيد استقبال الـ id الموحد من الـ route
        const { approvalNotes } = req.body;

        if (!id) {
            return res.status(400).json({ message: "معرّف طلب المرتجع مطلوب" });
        }

        const returnRequest = await ReturnRequest.findById(id).populate("invoiceId");
        if (!returnRequest) {
            return res.status(404).json({ message: "طلب المرتجع غير موجود" });
        }

        if (returnRequest.status !== "pending") {
            return res.status(400).json({ message: `لا يمكن الموافقة على طلب مرتجع حالته: ${returnRequest.status}` });
        }

        const approverId = req.user?.userId || req.user?._id || req.user?.id;
        if (!approverId) {
            return res.status(401).json({ message: "لم يتم العثور على صلاحيات المشرف، يرجى تسجيل الدخول مجدداً" });
        }

        let totalReturnAmount = 0;
        let totalReturnCost = 0;
        const processedReturnItems = [];

        // Loop مجمع ومحمي لتحديث المخازن وحساب التكاليف المستردة
        for (const item of returnRequest.items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ message: `المنتج ${item.name} لم يعد متوفراً بالنظام، لا يمكن إتمام المرتجع` });
            }

            // 1. إعادة السلع إلى الـ Stock فوراً
            product.stock += Number(item.quantity);
            await product.save();

            // 2. الحساب المحاسبي الفعلي للمنتج المسترجع بناءً على التكلفة الفعلية وسعر البيع بالطلب
            const itemReturnPrice = item.price * item.quantity;
            const itemReturnCost = (product.purchasePrice || 0) * item.quantity;

            totalReturnAmount += itemReturnPrice;
            totalReturnCost += itemReturnCost;

            // بناء كائن الصنف ليتوافق تماماً مع الـ Schema المعتمدة في جدول الـ Sale الخاص بك لعدم حدوث كراش
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

        // الحسابات الرياضية الصافية للمرتجع وتطبيق القيم السالبة لتعمل كفاتورة عكسية
        const netProfitImpact = -(totalReturnAmount - totalReturnCost);
        const returnInvoiceNumber = `RET-${Date.now().toString().slice(-6)}`;

        // 🌟 إنشاء الفاتورة بجدول Sale لتظهر مباشرة في كود المبيعات والـ getAllInvoices لديك
        const newReturnInvoice = new Sale({
            invoiceNumber: returnInvoiceNumber,
            originalInvoiceNumber: returnRequest.invoiceId?.invoiceNumber || "UNKNOWN",
            items: processedReturnItems,
            totalAmount: -totalReturnAmount,  // قيمة سالبة لتخصم من مبيعات المحل الإجمالية تلقائياً
            totalCost: -totalReturnCost,    // تكلفة سالبة
            netProfit: netProfitImpact,     // ربح سالب يعيد ميزان الربحية لمكانه الصحيح
            invoiceType: "return"
        });

        await newReturnInvoice.save();

        // 3. تحديث حالة وإغلاق ملف طلب المرتجع
        returnRequest.status = "approved";
        returnRequest.approverUserId = approverId;
        returnRequest.approvalDate = new Date();
        returnRequest.approvalNotes = approvalNotes ? approvalNotes.trim() : "تمت الموافقة وإصدار فاتورة مرتجع سالبة";
        await returnRequest.save();

        res.status(200).json({
            message: "تمت الموافقة على المرتجع، تحديث المخزن وإصدار الفاتورة المحاسبية بنجاح ↩️",
            returnRequest,
            invoice: newReturnInvoice
        });

    } catch (error) {
        console.error(`❌ Error in approveReturn: ${error.message}`);
        res.status(500).json({ message: "خطأ في معالجة الموافقة مالياً", error: error.message });
    }
};

/**
 * ❌ رفض طلب المرتجع من قبل الإدارة
 */
export const rejectReturn = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;

        if (!id || !rejectionReason?.trim()) {
            return res.status(400).json({ message: "معرّف الطلب وسبب الرفض مطلوبان لتوثيق السجل" });
        }

        const returnRequest = await ReturnRequest.findById(id);
        if (!returnRequest) {
            return res.status(404).json({ message: "طلب المرتجع غير موجود" });
        }

        if (returnRequest.status !== "pending") {
            return res.status(400).json({ message: "لا يمكن تعديل طلب مرتجع غير معلق" });
        }

        const rejecterId = req.user?.userId || req.user?._id || req.user?.id;

        returnRequest.status = "rejected";
        returnRequest.approverUserId = rejecterId;
        returnRequest.approvalDate = new Date();
        returnRequest.approvalNotes = rejectionReason.trim();
        await returnRequest.save();

        res.status(200).json({ message: "تم رفض طلب المرتجع وإغلاق الملف دون أي تعديل مالي", returnRequest });
    } catch (error) {
        res.status(500).json({ message: "خطأ في معالجة رفض طلب المرتجع", error: error.message });
    }
};

/**
 * ⏳ جلب الطلبات المعلقة للأدمن
 */
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

/**
 * 📜 جلب كامل سجل طلبات المرتجعات (المقبولة والمرفوضة)
 */
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