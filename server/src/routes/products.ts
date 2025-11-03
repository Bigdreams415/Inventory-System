import { Router } from 'express';
import { ProductController } from '../controllers/productController';

const router = Router();

// GET /api/products - Get all products
router.get('/', ProductController.getAllProducts);

// GET /api/products/search - Search products
router.get('/search', ProductController.searchProducts);

// GET /api/products/barcode/:barcode - Get product by barcode
router.get('/barcode/:barcode', ProductController.getProductByBarcode);

// GET /api/products/low-stock - Get low stock products
router.get('/low-stock', ProductController.getLowStockProducts);

// GET /api/products/with-margin - Get products with profit margin (for dashboard)
router.get('/with-margin', ProductController.getProductsWithMargin);

// GET /api/products/:id - Get product by ID
router.get('/:id', ProductController.getProductById);

// POST /api/products - Create new product
router.post('/', ProductController.createProduct);

// PUT /api/products/:id - Update product
router.put('/:id', ProductController.updateProduct);

// PATCH /api/products/:id/stock - Update stock only
router.patch('/:id/stock', ProductController.updateStock);

// DELETE /api/products/:id - Delete product
router.delete('/:id', ProductController.deleteProduct);

export default router;