import {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} from '../controllers/CategoryController.js';
import adminOnly from "../middlewares/adminOnly.js";
import userAuth from "../middlewares/userAuth.js";


import express from 'express';


const router = express.Router();

router.post('/add', userAuth, adminOnly, createCategory);
router.get('/', userAuth, getAllCategories);
router.get('/:id', userAuth, getCategoryById);
router.put('/:id', userAuth, adminOnly, updateCategory);
router.delete('/:id', userAuth, adminOnly, deleteCategory);

export default router;