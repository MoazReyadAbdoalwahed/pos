import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';

import authuser from '../middlewares/userAuth.js';
import adminOnly from '../middlewares/adminOnly.js';

const router = express.Router();

// Dashboard endpoints (frontend calls /api/dashboards)
router.get('/', authuser, adminOnly, getDashboardStats);
router.get('/stats', authuser, adminOnly, getDashboardStats);

export default router;
