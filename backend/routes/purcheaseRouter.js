import {
    createPurchaseInvoice,
    getAllPurchaseInvoices,
    getPurchaseInvoiceById,
    updatePurchaseInvoice,
    deletePurchaseInvoice,
} from '../controllers/purchaseController.js';

import userAuth from '../middlewares/userAuth.js';
import { adminOrManagerOnly } from '../middlewares/adminOnly.js';

import express from 'express';
const router = express.Router();


// Create a new purchase invoice
router.post('/add', userAuth, adminOrManagerOnly, createPurchaseInvoice);
// Get all purchase invoices
router.get('/', userAuth, adminOrManagerOnly, getAllPurchaseInvoices);
// Get a purchase invoice by ID
router.get('/:id', userAuth, adminOrManagerOnly, getPurchaseInvoiceById);
// Update a purchase invoice
router.put('/:id', userAuth, adminOrManagerOnly, updatePurchaseInvoice);
// Delete a purchase invoice
router.delete('/:id', userAuth, adminOrManagerOnly, deletePurchaseInvoice);

export default router;