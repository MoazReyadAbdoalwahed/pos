import express from 'express';
import {
    createReturnRequest,
    approveReturn,
    rejectReturn,
    getPendingReturns,
    getReturnHistory,
    getInvoiceDetails
} from '../controllers/returnController.js';

import userAuth from '../middlewares/userAuth.js';
import adminOnly from '../middlewares/adminOnly.js';

const router = express.Router();

// 🔍 جلب تفاصيل فاتورة للبحث عنها (متاح للكاشير والأدمن)
router.get('/details/:invoiceId', userAuth, getInvoiceDetails);

// 📝 إنشاء طلب مرتجع معلق (متاح للكاشير)
router.post('/request', userAuth, createReturnRequest);

// ✅ موافقة الأدمن على طلب المرتجع (تحديث المخزن وإنشاء فاتورة سالبة في جدول Sale)
router.put('/approve/:id', userAuth, adminOnly, approveReturn); // تم تحويلها لـ PUT وتصحيح المعرف لـ :id

// ❌ رفض طلب المرتجع من قبل الإدارة
router.put('/reject/:id', userAuth, adminOnly, rejectReturn); // تم تحويلها لـ PUT وتصحيح المعرف لـ :id

// ⏳ جلب الطلبات المعلقة (أدمن فقط)
router.get('/pending', userAuth, adminOnly, getPendingReturns);

// 📜 جلب سجل طلبات المرتجعات بالكامل
router.get('/history', userAuth, getReturnHistory);

// 🗑️ حذف طلب مرتجع (أدمن فقط) - للصيانة والتنظيف
router.delete('/:id', userAuth, adminOnly, async (req, res) => {
    try {
        const ReturnRequest = (await import('../models/retunModel.js')).default;
        const { id } = req.params;
        const deleted = await ReturnRequest.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: "طلب المرتجع غير موجود" });
        }
        res.status(200).json({ message: "تم حذف طلب المرتجع بنجاح", deleted });
    } catch (error) {
        res.status(500).json({ message: "خطأ في حذف طلب المرتجع", error: error.message });
    }
});

export default router;