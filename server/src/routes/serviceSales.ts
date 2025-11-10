import { Router } from 'express';
import { ServiceSalesController } from '../controllers/serviceSalesController';
import { AuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// GET /api/service-sales - Get all service sales for current pharmacy
router.get('/', ServiceSalesController.getServiceSales);

// POST /api/service-sales - Create new service sale
router.post('/', ServiceSalesController.createServiceSale);

// GET /api/service-sales/stats - Get service sales statistics
router.get('/stats/revenue', ServiceSalesController.getServiceSalesStats);

// GET /api/service-sales/today - Get today's service sales
router.get('/today', ServiceSalesController.getTodayServiceSales);

export default router;