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
import { adminOrManagerOnly } from '../middlewares/adminOnly.js';

const router = express.Router();

// Create a new product
router.post('/', userAuth, adminOrManagerOnly, createProduct);
router.post('/add', userAuth, adminOrManagerOnly, createProduct);
// Search products by name or SKU
router.get('/search', userAuth, searchProducts);
// Get all products
router.get('/', userAuth, getProducts);
// Get a single product by ID
router.get('/:id', userAuth, getProductById);
// Update a product by ID
router.put('/:id', userAuth, adminOrManagerOnly, updateProduct);
// Delete a product by ID
router.delete('/:id', userAuth, adminOrManagerOnly, deleteProduct);

export default router;