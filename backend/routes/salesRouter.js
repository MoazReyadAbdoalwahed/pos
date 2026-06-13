import express from 'express';
import { checkInvoice, getAllInvoices, returnInvoice } from '../controllers/salesController.js';
import userAuth from '../middlewares/userAuth.js'; // تصحيح المسار بالجمع s
import adminOnly from '../middlewares/adminOnly.js';
const router = express.Router();

// 🛒 مسار إنشاء فاتورة بيع جديدة
router.post('/check-invoice', userAuth, checkInvoice);

// 🔄 مسار إنشاء فاتورة مرتجع آمنة
router.post('/return-invoice', userAuth, adminOnly, returnInvoice);

// 📋 مسار عرض فواتير المبيعات والمرتجع
router.get('/', userAuth, getAllInvoices);

export default router;