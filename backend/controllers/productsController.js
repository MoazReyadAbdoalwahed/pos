import Product from '../models/productsModel.js';
import mongoose from 'mongoose';

// 1. إنشاء منتج جديد
const createProduct = async (req, res) => {
    try {
        const {
            name, wholesalePrice = 0, purchasePrice = 0, salePrice = 0,
            stock, initialStock, sku, category, supplierName,
            supplierInvoiceNumber, supplierInvoiceDate
        } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Product name is required.' });
        }

        if (sku) {
            const existingProduct = await Product.findOne({ sku: sku.trim() });
            if (existingProduct) {
                return res.status(400).json({ message: 'SKU must be unique. A product with this SKU already exists.' });
            }
        }

        // تم إصلاح المسافة الخفية وتعريف الحقل بشكل سليم
        const initialStockNumber = typeof initialStock !== 'undefined' ?
            Number(initialStock) :
            (typeof stock !== 'undefined' ? Number(stock) : 0);

        const newProduct = new Product({
            name: name.trim(),
            wholesalePrice: Number(wholesalePrice),
            purchasePrice: Number(purchasePrice),
            salePrice: Number(salePrice),
            stock: initialStockNumber,
            sku: sku ? sku.trim() : null,
            category: category || null,
            supplierName: supplierName || null,
            supplierInvoiceNumber: supplierInvoiceNumber || null,
            supplierInvoiceDate: supplierInvoiceDate || null
        });

        await newProduct.save();

        // دمج الفئة وعرض الاسم
        const populatedProduct = await Product.findById(newProduct._id).populate('category', 'name');

        // تم التعديل لإرسال المنتج بعد الدمج مباشرة للعميل
        res.status(201).json({ message: 'Product created successfully', product: populatedProduct });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// 2. جلب كافة المنتجات
const getProducts = async (req, res) => {
    try {
        const products = await Product.find().populate('category', 'name').sort({ createdAt: -1 });
        res.status(200).json({ message: 'Products retrieved successfully', products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// 3. جلب منتج واحد بواسطة الـ ID
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Product ID format' });
        }

        const product = await Product.findById(id).populate('category', 'name');
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product retrieved successfully', product });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// 4. تعديل منتج بواسطة الـ ID
// Update a product by ID (النسخة المرنة والمصلحة)
const updateProduct = async (req, res) => {
    try {
        const id = req.params.id;

        // 1. التحقق من صحة هيكل الـ ID لمنع انهيار السيرفر
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Product ID format' });
        }

        const {
            name, wholesalePrice, purchasePrice, salePrice, stock, sku,
            category, supplierName, supplierInvoiceNumber, supplierInvoiceDate
        } = req.body;

        // 2. بناء كائن تحديث فارغ
        const updatedData = {};

        // 3. إضافة الحقول المرسلة في الطلب فقط إلى كائن التحديث (Dynamic Payload)
        if (name !== undefined) updatedData.name = name.trim();
        if (wholesalePrice !== undefined) updatedData.wholesalePrice = Number(wholesalePrice);
        if (purchasePrice !== undefined) updatedData.purchasePrice = Number(purchasePrice);
        if (salePrice !== undefined) updatedData.salePrice = Number(salePrice);
        if (stock !== undefined) updatedData.stock = Number(stock);
        if (sku !== undefined) updatedData.sku = sku.trim();

        // الحقول المرتبطة بالفواتير والموردين (تحدث فقط إذا تم إرسالها)
        if (category !== undefined) updatedData.category = category || null;
        if (supplierName !== undefined) updatedData.supplierName = supplierName;
        if (supplierInvoiceNumber !== undefined) updatedData.supplierInvoiceNumber = supplierInvoiceNumber;
        if (supplierInvoiceDate !== undefined) updatedData.supplierInvoiceDate = supplierInvoiceDate || null;

        // 4. تنفيذ التعديل في قاعدة البيانات
        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            updatedData,
            { new: true, runValidators: true }
        ).populate('category', 'name');

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// 5. حذف منتج بواسطة الـ ID
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Product ID format' });
        }

        const deletedProduct = await Product.findByIdAndDelete(id);
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

export { createProduct, getProducts, getProductById, updateProduct, deleteProduct };