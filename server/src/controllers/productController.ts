import { Request, Response } from 'express';
import { ProductModel } from '../models/Product';
import { ApiResponse, PaginatedResponse, Product} from '../types';

export class ProductController {
  // Get all products for current pharmacy
  static async getAllProducts(req: Request, res: Response) {
    try {
      const pharmacyId = req.pharmacyId!;
      const products = await ProductModel.getAll(pharmacyId);
      
      const response: ApiResponse<Product[]> = {
        success: true,
        data: products
      };
      res.json(response);
    } catch (error) {
      console.error('Error getting products:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch products'
      };
      res.status(500).json(response);
    }
  }

  // Get product by ID for current pharmacy
  static async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const pharmacyId = req.pharmacyId!;
      
      const product = await ProductModel.getById(id, pharmacyId);
      
      if (!product) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Product not found'
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse<Product> = {
        success: true,
        data: product
      };
      res.json(response);
    } catch (error) {
      console.error('Error getting product:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch product'
      };
      res.status(500).json(response);
    }
  }

  // Barcode lookup for current pharmacy
  public static async getProductByBarcode(req: Request, res: Response): Promise<void> {
    try {
      const { barcode } = req.params;
      const pharmacyId = req.pharmacyId!;
      
      if (!barcode) {
        res.status(400).json({
          success: false,
          error: 'Barcode is required'
        });
        return;
      }

      const product = await ProductModel.getByBarcode(barcode, pharmacyId);

      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found with this barcode'
        });
        return;
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Error fetching product by barcode:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch product by barcode'
      });
    }
  }

  // Create new product for current pharmacy
  static async createProduct(req: Request, res: Response) {
    try {
      const productData = req.body;
      const pharmacyId = req.pharmacyId!;
      
      // Enhanced validation with new fields
      const validation = ProductModel.validateProductData(productData);
      if (!validation.isValid) {
        const response: ApiResponse<null> = {
          success: false,
          error: validation.errors.join(', ')
        };
        return res.status(400).json(response);
      }

      // Add pharmacy ID to product data
      const productDataWithPharmacy = {
        ...productData,
        pharmacy_id: pharmacyId
      };

      const newProduct = await ProductModel.create(productDataWithPharmacy);
      const response: ApiResponse<Product> = {
        success: true,
        data: newProduct,
        message: 'Product created successfully'
      };
      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating product:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to create product'
      };
      res.status(500).json(response);
    }
  }

  // Update product for current pharmacy
  static async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const productData = req.body;
      const pharmacyId = req.pharmacyId!;

      // Check if product exists in current pharmacy
      const existingProduct = await ProductModel.getById(id, pharmacyId);
      if (!existingProduct) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Product not found'
        };
        return res.status(404).json(response);
      }

      // Validate update data (partial validation)
      if (productData.buy_price !== undefined && productData.buy_price < 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Buy price cannot be negative'
        };
        return res.status(400).json(response);
      }

      if (productData.sell_price !== undefined && productData.sell_price < 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Sell price cannot be negative'
        };
        return res.status(400).json(response);
      }

      // Validate price relationship if both are provided
      if (productData.buy_price !== undefined && productData.sell_price !== undefined) {
        if (productData.buy_price > productData.sell_price) {
          const response: ApiResponse<null> = {
            success: false,
            error: 'Sell price must be greater than or equal to buy price'
          };
          return res.status(400).json(response);
        }
      }

      // Validate price relationship if only one is provided
      if (productData.buy_price !== undefined && productData.sell_price === undefined) {
        if (productData.buy_price > existingProduct.sell_price) {
          const response: ApiResponse<null> = {
            success: false,
            error: 'Buy price cannot be greater than current sell price'
          };
          return res.status(400).json(response);
        }
      }

      if (productData.sell_price !== undefined && productData.buy_price === undefined) {
        if (existingProduct.buy_price > productData.sell_price) {
          const response: ApiResponse<null> = {
            success: false,
            error: 'Sell price cannot be less than current buy price'
          };
          return res.status(400).json(response);
        }
      }

      const updatedProduct = await ProductModel.update(id, productData, pharmacyId);
      const response: ApiResponse<Product> = {
        success: true,
        data: updatedProduct,
        message: 'Product updated successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error updating product:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to update product'
      };
      res.status(500).json(response);
    }
  }

  // Delete product from current pharmacy
  static async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const pharmacyId = req.pharmacyId!;

      const existingProduct = await ProductModel.getById(id, pharmacyId);
      if (!existingProduct) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Product not found'
        };
        return res.status(404).json(response);
      }

      await ProductModel.delete(id, pharmacyId);
      const response: ApiResponse<null> = {
        success: true,
        message: 'Product deleted successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error deleting product:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to delete product'
      };
      res.status(500).json(response);
    }
  }

  // Search products in current pharmacy
  static async searchProducts(req: Request, res: Response) {
    try {
      const { q } = req.query;
      const pharmacyId = req.pharmacyId!;
      
      if (!q || typeof q !== 'string') {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Search query is required'
        };
        return res.status(400).json(response);
      }

      const products = await ProductModel.search(q, pharmacyId);
      const response: ApiResponse<Product[]> = {
        success: true,
        data: products
      };
      res.json(response);
    } catch (error) {
      console.error('Error searching products:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to search products'
      };
      res.status(500).json(response);
    }
  }

  // Update stock for current pharmacy
  static async updateStock(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { stock } = req.body;
      const pharmacyId = req.pharmacyId!;

      if (typeof stock !== 'number' || stock < 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Valid stock quantity is required'
        };
        return res.status(400).json(response);
      }

      const existingProduct = await ProductModel.getById(id, pharmacyId);
      if (!existingProduct) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Product not found'
        };
        return res.status(404).json(response);
      }

      await ProductModel.updateStock(id, stock, pharmacyId);
      const response: ApiResponse<null> = {
        success: true,
        message: 'Stock updated successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error updating stock:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to update stock'
      };
      res.status(500).json(response);
    }
  }

  // Get products with profit margin for current pharmacy
  static async getProductsWithMargin(req: Request, res: Response) {
    try {
      const pharmacyId = req.pharmacyId!;
      const products = await ProductModel.getAll(pharmacyId);
      
      // Calculate profit margin for each product
      const productsWithMargin = products.map(product => {
        const margin = ProductModel.calculateMargin(product.buy_price, product.sell_price);
        return {
          ...product,
          profit_margin: margin
        };
      });

      const response: ApiResponse<any[]> = {
        success: true,
        data: productsWithMargin
      };
      res.json(response);
    } catch (error) {
      console.error('Error getting products with margin:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch products with margin data'
      };
      res.status(500).json(response);
    }
  }

  // Get low stock products for current pharmacy
  static async getLowStockProducts(req: Request, res: Response) {
    try {
      const { threshold = 10 } = req.query;
      const thresholdNum = parseInt(threshold as string, 10) || 10;
      const pharmacyId = req.pharmacyId!;

      const products = await ProductModel.getLowStock(thresholdNum, pharmacyId);
      
      const productsWithValue = products.map(product => ({
        ...product,
        stock_value: product.buy_price * product.stock
      }));

      const response: ApiResponse<any[]> = {
        success: true,
        data: productsWithValue
      };
      res.json(response);
    } catch (error) {
      console.error('Error getting low stock products:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch low stock products'
      };
      res.status(500).json(response);
    }
  }
}