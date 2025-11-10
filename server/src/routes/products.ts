import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { AuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// ========== PUBLIC ROUTES (No auth required) ==========

// GET /api/products - Get all products
router.get('/', ProductController.getAllProducts);

// GET /api/products/search - Search products
router.get('/search', ProductController.searchProducts);

// GET /api/products/barcode/:barcode - Get product by barcode
router.get('/barcode/:barcode', ProductController.getProductByBarcode);

// GET /api/products/low-stock - Get low stock products
router.get('/low-stock', ProductController.getLowStockProducts);

// GET /api/products/:id - Get product by ID
router.get('/:id', ProductController.getProductById);

// ========== PROTECTED ROUTES (Admin auth required) ==========

// GET /api/products/with-margin - Get products with profit margin (for dashboard) - PROTECTED
router.get('/with-margin', AuthMiddleware.requireAuth, ProductController.getProductsWithMargin);

// POST /api/products - Create new product - PROTECTED
router.post('/', AuthMiddleware.requireAuth, ProductController.createProduct);

// PUT /api/products/:id - Update product - PROTECTED
router.put('/:id', AuthMiddleware.requireAuth, ProductController.updateProduct);

// PATCH /api/products/:id/stock - Update stock only - PROTECTED
router.patch('/:id/stock', AuthMiddleware.requireAuth, ProductController.updateStock);

// DELETE /api/products/:id - Delete product - PROTECTED
router.delete('/:id', AuthMiddleware.requireAuth, ProductController.deleteProduct);

export default router;