import PurchaseInvoice from '../models/purchaseModel.js';
import Product from '../models/productsModel.js'; // استيراد موديل المنتجات الأساسي
import mongoose from 'mongoose';

// 1. إنشاء فاتورة مشتريات جديدة وزيادة المخزن تلقائياً
const createPurchaseInvoice = async (req, res) => {
    try {
        const { purchaseInvoiceNumber, supplierName, purchaseDate, items } = req.body;

        // التحقق من الحقول الأساسية
        if (!purchaseInvoiceNumber || !supplierName || !purchaseDate || !items || !items.length) {
            return res.status(400).json({ message: 'All fields and at least one item are required.' });
        }

        // فحص تكرار رقم الفاتورة
        const existingInvoice = await PurchaseInvoice.findOne({ purchaseInvoiceNumber });
        if (existingInvoice) {
            return res.status(400).json({ message: 'Purchase invoice number already exists' });
        }

        // حساب الإجمالي الكلي للفاتورة
        const totalAmount = items.reduce((total, item) => total + (Number(item.puchasePrice) * Number(item.quantity)), 0);

        // تحديث كميات المنتجات في المخزن بشكل متزامن وصحيح (for...of)
        for (const item of items) {
            if (!mongoose.Types.ObjectId.isValid(item.productId)) {
                return res.status(400).json({ message: `Invalid Product ID: ${item.productId}` });
            }

            const product = await Product.findById(item.productId);
            if (product) {
                product.stock += Number(item.quantity);
                // تحديث أسعار المنتج تلقائياً بناءً على آخر فاتورة شراء (ميزة اختيارية احترافية)
                product.purchasePrice = Number(item.puchasePrice);
                if (item.suggestedSalePrice) product.salePrice = Number(item.suggestedSalePrice);
                if (item.suggestedWholesalePrice) product.wholesalePrice = Number(item.suggestedWholesalePrice);

                await product.save();
            } else {
                return res.status(404).json({ message: `Product with ID ${item.productId} not found.` });
            }
        }

        // حفظ الفاتورة
        const newPurchaseInvoice = new PurchaseInvoice({
            purchaseInvoiceNumber,
            supplierName,
            purchaseDate,
            items,
            totalAmount,
        });

        const savedInvoice = await newPurchaseInvoice.save();
        res.status(201).json({ message: 'Purchase invoice created and stock updated successfully', savedInvoice });
    } catch (error) {
        res.status(500).json({ message: 'Error creating purchase invoice', error: error.message });
    }
};

// 2. جلب جميع فواتير المشتريات
const getAllPurchaseInvoices = async (req, res) => {
    try {
        const purchaseInvoices = await PurchaseInvoice.find().sort({ createdAt: -1 });
        res.status(200).json(purchaseInvoices);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching purchase invoices', error: error.message });
    }
};

// 3. جلب فاتورة مشتريات محددة بالـ ID
const getPurchaseInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Invoice ID format' });
        }

        const purchaseInvoice = await PurchaseInvoice.findById(id).populate('items.productId', 'name sku');
        if (!purchaseInvoice) {
            return res.status(404).json({ message: 'Purchase invoice not found' });
        }
        res.status(200).json(purchaseInvoice);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching purchase invoice', error: error.message });
    }
};

// 4. تحديث فاتورة مشتريات (مع معالجة الفروقات المخزنية)
const updatePurchaseInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Invoice ID format' });
        }

        const { purchaseInvoiceNumber, supplierName, purchaseDate, items } = req.body;
        const purchaseInvoice = await PurchaseInvoice.findById(id);
        if (!purchaseInvoice) {
            return res.status(404).json({ message: 'Purchase invoice not found' });
        }

        // إذا تم تعديل العناصر، يجب إرجاع المخزن القديم أولاً ثم إضافة الجديد لمنع العبث بالحسابات
        if (items) {
            // 1. إرجاع المخزن كما كان قبل الفاتورة
            for (const oldItem of purchaseInvoice.items) {
                await Product.findByIdAndUpdate(oldItem.productId, { $inc: { stock: -oldItem.quantity } });
            }

            // 2. تطبيق الكميات الجديدة
            for (const newItem of items) {
                await Product.findByIdAndUpdate(newItem.productId, { $inc: { stock: newItem.quantity } });
            }
            purchaseInvoice.items = items;
            purchaseInvoice.totalAmount = items.reduce((total, item) => total + (Number(item.puchasePrice) * Number(item.quantity)), 0);
        }

        if (purchaseInvoiceNumber) purchaseInvoice.purchaseInvoiceNumber = purchaseInvoiceNumber;
        if (supplierName) purchaseInvoice.supplierName = supplierName;
        if (purchaseDate) purchaseInvoice.purchaseDate = purchaseDate;

        const updatedInvoice = await purchaseInvoice.save();
        res.status(200).json({ message: 'Invoice updated successfully', updatedInvoice });
    } catch (error) {
        res.status(500).json({ message: 'Error updating purchase invoice', error: error.message });
    }
};

// 5. حذف فاتورة مشتريات (وخصم كمياتها من المخزن)
const deletePurchaseInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Invoice ID format' });
        }

        const purchaseInvoice = await PurchaseInvoice.findById(id);
        if (!purchaseInvoice) {
            return res.status(404).json({ message: 'Purchase invoice not found' });
        }

        // خصم الكميات الواردة بالفاتورة من المخزن لأن الفاتورة ألغيت/حذفت
        for (const item of purchaseInvoice.items) {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
        }

        // التصحيح: استخدام findByIdAndDelete بدلاً من remove المحذوفة
        await PurchaseInvoice.findByIdAndDelete(id);
        res.status(200).json({ message: 'Purchase invoice deleted and stock adjusted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting purchase invoice', error: error.message });
    }
};

export {
    createPurchaseInvoice,
    getAllPurchaseInvoices,
    getPurchaseInvoiceById,
    updatePurchaseInvoice,
    deletePurchaseInvoice,
};