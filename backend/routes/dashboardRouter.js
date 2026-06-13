import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';

import authuser from '../middlewares/userAuth.js';
import authAdmin from '../middlewares/adminOnly.js';

const router = express.Router();

// Dashboard endpoints (frontend calls /api/dashboards)
router.get('/', authuser, authAdmin, getDashboardStats);
router.get('/stats', authuser, authAdmin, getDashboardStats);

export default router;
