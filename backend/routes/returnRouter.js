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
import { adminOrManagerOnly } from '../middlewares/adminOnly.js';

const router = express.Router();

// 🔍 جلب تفاصيل فاتورة للبحث عنها (أدمن أو مدير)
router.get('/details/:invoiceId', userAuth, adminOrManagerOnly, getInvoiceDetails);

// 📝 إنشاء طلب مرتجع معلق (أدمن أو مدير)
router.post('/request', userAuth, adminOrManagerOnly, createReturnRequest);

// ✅ موافقة الأدمن أو المدير على طلب المرتجع (تحديث المخزن وإنشاء فاتورة سالبة في جدول Sale)
router.put('/approve/:id', userAuth, adminOrManagerOnly, approveReturn); // تم تحويلها لـ PUT وتصحيح المعرف لـ :id

// ❌ رفض طلب المرتجع من قبل الإدارة أو المدير
router.put('/reject/:id', userAuth, adminOrManagerOnly, rejectReturn); // تم تحويلها لـ PUT وتصحيح المعرف لـ :id

// ⏳ جلب الطلبات المعلقة (أدمن أو مدير)
router.get('/pending', userAuth, adminOrManagerOnly, getPendingReturns);

// 📜 جلب سجل طلبات المرتجعات بالكامل
router.get('/history', userAuth, adminOrManagerOnly, getReturnHistory);

// 🗑️ حذف طلب مرتجع (أدمن أو مدير) - للصيانة والتنظيف
router.delete('/:id', userAuth, adminOrManagerOnly, async (req, res) => {
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