import Sale from '../models/salesModel.js';
import Product from '../models/productsModel.js';
import mongoose from 'mongoose';
import { sendLowStockAlert } from '../services/Telegrambotservice .js'; // تم تصحيح الاستيراد بناءً على الراوتر

// 🛒 1. إنشاء فاتورة مبيعات (يغطي: قطاعي، جملة، يدوي ومحمي محاسبياً)
const checkInvoice = async (req, res) => {
    try {
        const { items, priceType = 'sale', paymentMethod = 'cash', cashierId, cashierName } = req.body;

        if (!items || !items.length) {
            return res.status(400).json({ message: 'لم يتم تزويد أي أصناف للبيع' });
        }

        const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
        let totalAmount = 0;
        let totalCost = 0;
        const processedItems = [];

        for (const item of items) {
            if (!mongoose.Types.ObjectId.isValid(item.productId)) {
                return res.status(400).json({ message: `معرف المنتج غير صحيح: ${item.productId}` });
            }

            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ message: `المنتج غير متوفر في النظام` });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    message: `الكمية المطلوبة من (${product.name}) أكبر من المتاح في المخزن! المتاح حالياً: ${product.stock}`
                });
            }

            // خصم الكمية وتحديث المخزن فوراً
            product.stock -= item.quantity;
            await product.save();

            if (product.stock <= 1) {
                try {
                    await sendLowStockAlert(product);
                    console.log(`✅ تم إرسال تنبيه انخفاض المخزون لـ ${product.name} إلى Telegram`);
                } catch (err) {
                    console.error(`❌ فشل إرسال تنبيه انخفاض المخزون لـ ${product.name}:`, err.message);
                }
            }

            // 🌟 تطبيق منطق الخيارات الثلاثة للبيع (قطاعي - جملة - يدوي) داخل الـ loop بشكل صحيح
            let actualPrice;
            let currentPriceType = item.priceType || priceType;

            if (item.customPrice !== undefined && item.customPrice !== null) {
                actualPrice = Number(item.customPrice);
                currentPriceType = 'custom';
            } else {
                actualPrice = currentPriceType === 'wholesale' ? (product.wholesalePrice || 0) : (product.salePrice || 0);
            }

            // محاسبياً: التكلفة تعتمد حصراً على سعر الشراء الفعلي للمنتج
            const actualCost = product.purchasePrice || 0;

            const itemTotalPrice = actualPrice * item.quantity;
            const itemTotalCost = actualCost * item.quantity;

            totalAmount += itemTotalPrice;
            totalCost += itemTotalCost;

            // بناء كائن الصنف ليتطابق مع الـ Schema حرفياً
            processedItems.push({
                productId: product._id,
                name: product.name,
                quantity: item.quantity,
                salesPrice: actualPrice,
                wholesalePrice: product.wholesalePrice || 0,
                totalItemPrice: itemTotalPrice,
                priceType: currentPriceType
            });
        } // 👈 تم نقل إغلاق الـ loop إلى هنا بعد معالجة كافة العناصر بنجbg

        const netProfit = totalAmount - totalCost;

        // التحقق من الـ cashierId لحمايته من الـ CastError في المونجو
        const validCashierId = mongoose.Types.ObjectId.isValid(cashierId) ? cashierId : null;

        const newInvoice = new Sale({
            invoiceNumber,
            items: processedItems,
            totalAmount,
            totalCost,
            netProfit,
            paymentMethod,
            invoiceType: "sales",
            cashierId: validCashierId, // يمنع الكراش إذا كان الـ ID نصياً غير متوافق
            cashierName: cashierName || null // حفظ اسم الكاشير
        });

        await newInvoice.save();

        return res.status(201).json({
            message: "تم تسجيل عملية البيع بنجاح وتحديث جرد المخزن 🛒",
            invoice: newInvoice
        });

    } catch (error) {
        console.error('حدث خطأ أثناء الفاتورة:', error);
        return res.status(500).json({ message: "حدث خطأ داخل السيرفر أثناء معالجة الفاتورة", error: error.message });
    }
};

// 🔄 2. معالجة مرتجع الفواتير الآمن والمربوط بالفاتورة الأصلية
const returnInvoice = async (req, res) => {
    try {
        const { originalInvoiceNumber, itemsToReturn, cashierId, cashierName, returnType } = req.body;

        if (!originalInvoiceNumber || !itemsToReturn || !itemsToReturn.length) {
            return res.status(400).json({ message: 'رقم الفاتورة الأصلية والأصناف المراد إرجاعها مطلوبة' });
        }

        const isDirectReturn = returnType === 'direct' || originalInvoiceNumber === 'DIRECT-RETURN';
        let originalInvoice = null;

        if (!isDirectReturn) {
            originalInvoice = await Sale.findOne({ invoiceNumber: originalInvoiceNumber, invoiceType: 'sales' });
            if (!originalInvoice) {
                return res.status(404).json({ message: 'لم يتم العثور على فاتورة المبيعات الأصلية في النظام' });
            }
        }

        const returnInvoiceNumber = `RET-${Date.now().toString().slice(-6)}`;
        let totalReturnAmount = 0;
        let totalReturnCost = 0;
        const processedReturnItems = [];

        for (const returnItem of itemsToReturn) {
            const product = await Product.findById(returnItem.productId);
            if (!product) {
                return res.status(404).json({ message: `المنتج غير متوفر في النظام لإجراء المرتجع` });
            }

            const priceType = returnItem.priceType || 'sale';
            const returnPrice = Number(returnItem.activePrice ?? product.salePrice);
            if (returnPrice < 0) {
                return res.status(400).json({ message: 'السعر المرجع يجب أن يكون رقماً موجباً أو صفر' });
            }

            if (isDirectReturn) {
                if (returnItem.quantity <= 0) {
                    return res.status(400).json({ message: 'يجب أن تكون كمية المرتجع أكبر من الصفر' });
                }
            } else {
                const originalItem = originalInvoice.items.find(i => i.productId.toString() === returnItem.productId);
                if (!originalItem) {
                    return res.status(400).json({ message: `المنتج ${returnItem.productId} ليس جزءاً من الفاتورة الأصلية.` });
                }

                if (returnItem.quantity > originalItem.quantity) {
                    return res.status(400).json({ message: `لا يمكن إرجاع كمية أكبر مما تم شراؤه بالفعل في الفاتورة الأصلية (${originalItem.quantity} قطع).` });
                }
            }

            // إعادة السلع إلى الـ Stock
            product.stock += Number(returnItem.quantity);
            await product.save();

            const itemReturnPrice = returnPrice * returnItem.quantity;
            const itemReturnCost = (product.purchasePrice || 0) * returnItem.quantity;

            totalReturnAmount += itemReturnPrice;
            totalReturnCost += itemReturnCost;

            processedReturnItems.push({
                productId: returnItem.productId,
                name: product.name,
                quantity: returnItem.quantity,
                salesPrice: returnPrice,
                wholesalePrice: product.wholesalePrice || 0,
                totalItemPrice: itemReturnPrice,
                priceType
            });
        }

        const netProfit = -(totalReturnAmount - totalReturnCost);
        const validCashierId = mongoose.Types.ObjectId.isValid(cashierId) ? cashierId : null;

        const newReturnInvoice = new Sale({
            invoiceNumber: returnInvoiceNumber,
            originalInvoiceNumber,
            items: processedReturnItems,
            totalAmount: -totalReturnAmount,
            totalCost: -totalReturnCost,
            netProfit: netProfit,
            invoiceType: 'return',
            cashierId: validCashierId,
            cashierName: cashierName || null // حفظ اسم الكاشير
        });

        await newReturnInvoice.save();
        return res.status(201).json({ message: 'تم معالجة فاتورة المرتجع بنجاح وإعادة السلع للمخزن ↩️', invoice: newReturnInvoice });
    } catch (error) {
        console.error('Error processing return invoice:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// 📋 3. جلب جميع الفواتير مرتبة من الأحدث للأقدم
const getAllInvoices = async (req, res) => {
    try {
        const invoices = await Sale.find().sort({ createdAt: -1 });
        return res.status(200).json({ message: 'تم جلب الفواتير بنجاح', invoices });
    } catch (error) {
        console.error('Error retrieving invoices:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export { checkInvoice, returnInvoice, getAllInvoices };