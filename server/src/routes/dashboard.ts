import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { AuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// GET /api/dashboard/summary - Get main dashboard metrics
router.get('/summary', AuthMiddleware.requireAuth, DashboardController.getDashboardSummary);

// GET /api/dashboard/sales-trend - Get sales trend data for charts
router.get('/sales-trend', DashboardController.getSalesTrend);

// GET /api/dashboard/categories - Get category distribution
router.get('/categories', AuthMiddleware.requireAuth, DashboardController.getCategoryDistribution);

// GET /api/dashboard/recent-sales - Get recent sales
router.get('/recent-sales', DashboardController.getRecentSales);

// GET /api/dashboard/low-stock - Get low stock products
router.get('/low-stock', DashboardController.getLowStockProducts);

// GET /api/dashboard/stock-worth - Get total stock worth
router.get('/dashboard/stock-worth', DashboardController.getTotalStockWorth);

export default router;