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
        const processedItems = [];

        for (const item of items) {
            const itemSku = item.sku || item.barcode || item.name?.replace(/\s+/g, '-').toUpperCase();
            if (!itemSku) {
                return res.status(400).json({ message: 'Each purchase item must include a SKU or barcode.' });
            }

            let product = null;
            if (item.productId && mongoose.Types.ObjectId.isValid(item.productId)) {
                product = await Product.findById(item.productId);
            }

            if (!product && itemSku) {
                product = await Product.findOne({ sku: itemSku });
            }

            if (!product) {
                // إنشاء منتج جديد تلقائياً إذا كان غير موجود في النظام
                const salePrice = item.suggestedSalePrice ? Number(item.suggestedSalePrice) : Number(item.puchasePrice);
                const wholesalePrice = item.suggestedWholesalePrice ? Number(item.suggestedWholesalePrice) : 0;
                const newProduct = new Product({
                    name: item.name,
                    sku: itemSku,
                    purchasePrice: Number(item.puchasePrice),
                    salePrice,
                    wholesalePrice,
                    stock: 0,
                    supplierName,
                    supplierInvoiceNumber: purchaseInvoiceNumber,
                    supplierInvoiceDate: purchaseDate,
                });
                product = await newProduct.save();
            }

            // تأكيد العلاقة بين الصنف والمنتج
            item.productId = product._id;
            item.sku = product.sku;

            product.stock += Number(item.quantity);
            product.purchasePrice = Number(item.puchasePrice);
            if (item.suggestedSalePrice !== undefined && item.suggestedSalePrice !== null) {
                product.salePrice = Number(item.suggestedSalePrice);
            }
            if (item.suggestedWholesalePrice !== undefined && item.suggestedWholesalePrice !== null) {
                product.wholesalePrice = Number(item.suggestedWholesalePrice);
            }

            await product.save();
            processedItems.push(item);
        }

        // حفظ الفاتورة
        const newPurchaseInvoice = new PurchaseInvoice({
            purchaseInvoiceNumber,
            supplierName,
            purchaseDate,
            items: processedItems,
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