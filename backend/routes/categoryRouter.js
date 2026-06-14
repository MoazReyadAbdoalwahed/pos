import {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} from '../controllers/CategoryController.js';
import { adminOrManagerOnly } from "../middlewares/adminOnly.js";
import userAuth from "../middlewares/userAuth.js";


import express from 'express';


const router = express.Router();

router.post('/add', userAuth, adminOrManagerOnly, createCategory);
router.get('/', userAuth, getAllCategories);
router.get('/:id', userAuth, getCategoryById);
router.put('/:id', userAuth, adminOrManagerOnly, updateCategory);
router.delete('/:id', userAuth, adminOrManagerOnly, deleteCategory);

export default router;