import {
    createPurchaseInvoice,
    getAllPurchaseInvoices,
    getPurchaseInvoiceById,
    updatePurchaseInvoice,
    deletePurchaseInvoice,
} from '../controllers/purchaseController.js';

import userAuth from '../middlewares/userAuth.js';
import adminAuth from '../middlewares/adminOnly.js';

import express from 'express';
const router = express.Router();


// Create a new purchase invoice
router.post('/add', userAuth, adminAuth, createPurchaseInvoice);
// Get all purchase invoices
router.get('/', userAuth, adminAuth, getAllPurchaseInvoices);
// Get a purchase invoice by ID
router.get('/:id', userAuth, adminAuth, getPurchaseInvoiceById);
// Update a purchase invoice
router.put('/:id', userAuth, adminAuth, updatePurchaseInvoice);
// Delete a purchase invoice
router.delete('/:id', userAuth, adminAuth, deletePurchaseInvoice);

export default router;