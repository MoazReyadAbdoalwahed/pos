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

export default router;