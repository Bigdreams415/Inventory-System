import { Router } from 'express';
import { SaleController } from '../controllers/saleController';
import { dbService } from '../models/database';

const router = Router();

// POST /api/sales - Create new sale
router.post('/', SaleController.createSale);

// GET /api/sales - Get all sales with pagination
router.get('/', SaleController.getSales);

// GET /api/sales/today - Get today's sales with summary
router.get('/today', SaleController.getTodaySales);

// GET /api/sales/:id - Get sale by ID with items
router.get('/:id', SaleController.getSaleById);

// DEBUG: Check specific products by IDs
router.get('/debug/check-products', async (req, res) => {
  try {
    const { productIds } = req.query;
    
    if (!productIds || typeof productIds !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'productIds parameter is required'
      });
    }

    const ids = productIds.split(',');
    const placeholders = ids.map(() => '?').join(',');
    
    const products = await dbService.all(
      `SELECT id, name, stock, buy_price, sell_price FROM products WHERE id IN (${placeholders})`,
      ids
    ) as Array<{ id: string; name: string; stock: number; buy_price: number; sell_price: number }>;

    const foundIds = products.map(p => p.id);
    const missingIds = ids.filter(id => !foundIds.includes(id));

    res.json({
      success: true,
      data: {
        requestedIds: ids,
        foundProducts: products,
        missingIds: missingIds,
        totalRequested: ids.length,
        totalFound: products.length,
        totalMissing: missingIds.length
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check products'
    });
  }
});

// DEBUG: Get all products (for comparison)
router.get('/debug/all-products', async (_req, res) => {
  try {
    const products = await dbService.all(`
      SELECT id, name, stock, buy_price, sell_price, created_at 
      FROM products 
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

// DEBUG: Check database schema
router.get('/debug/schema', async (_req, res) => {
  try {
    const tables = await dbService.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `);
    
    res.json({
      success: true,
      data: tables
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schema'
    });
  }
});

export default router;