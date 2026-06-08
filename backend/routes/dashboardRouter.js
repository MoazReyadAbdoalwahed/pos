import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';

import authuser from '../middlewares/userAuth.js';
import authAdmin from '../middlewares/adminOnly.js';

const router = express.Router();


router.get('/stats', authuser, authAdmin, getDashboardStats);

export default router;
