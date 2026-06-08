import {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
} from '../controllers/productsController.js';

import express from 'express';

import userAuth from '../middlewares/userAuth.js';
import adminAuth from '../middlewares/adminOnly.js';

const router = express.Router();

// Create a new product
router.post('/', userAuth, adminAuth, createProduct);
// Get all products
router.get('/', userAuth, getProducts);
// Get a single product by ID
router.get('/:id', userAuth, getProductById);
// Update a product by ID
router.put('/:id', userAuth, adminAuth, updateProduct);
// Delete a product by ID
router.delete('/:id', userAuth, adminAuth, deleteProduct);

export default router;