import {
    createProduct,
    getProducts,
    getProductById,
    searchProducts,
    updateProduct,
    deleteProduct
} from '../controllers/productsController.js';

import express from 'express';

import userAuth from '../middlewares/userAuth.js';
import adminAuth from '../middlewares/adminOnly.js';

const router = express.Router();

// Create a new product
router.post('/', userAuth, adminAuth, createProduct);
router.post('/add', userAuth, adminAuth, createProduct);
// Search products by name or SKU
router.get('/search', userAuth, searchProducts);
// Get all products
router.get('/', userAuth, getProducts);
// Get a single product by ID
router.get('/:id', userAuth, getProductById);
// Update a product by ID
router.put('/:id', userAuth, adminAuth, updateProduct);
// Delete a product by ID
router.delete('/:id', userAuth, adminAuth, deleteProduct);

export default router;