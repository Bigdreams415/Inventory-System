import { dbService } from './database';
import { Product, ApiResponse, PaginatedResponse } from '../types';

export class ProductModel {
  // Get all products for a specific pharmacy with optional pagination
  static async getAll(pharmacyId: string, limit?: number, offset?: number): Promise<Product[]> {
    let query = 'SELECT * FROM products WHERE pharmacy_id = ? ORDER BY name';
    const params: any[] = [pharmacyId];

    if (limit !== undefined) {
      query += ' LIMIT ?';
      params.push(limit);
    }
    if (offset !== undefined) {
      query += ' OFFSET ?';
      params.push(offset);
    }

    return await dbService.all<Product>(query, params);
  }

  // Get total count of products for a pharmacy
  static async getCount(pharmacyId: string): Promise<number> {
    const result = await dbService.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM products WHERE pharmacy_id = ?', 
      [pharmacyId]
    );
    return result?.count || 0;
  }

  // Get product by ID for a specific pharmacy
  static async getById(id: string, pharmacyId: string): Promise<Product | undefined> {
    const query = 'SELECT * FROM products WHERE id = ? AND pharmacy_id = ?';
    return await dbService.get<Product>(query, [id, pharmacyId]);
  }

  // Get product by barcode for a specific pharmacy
  static async getByBarcode(barcode: string, pharmacyId: string): Promise<Product | undefined> {
    const query = 'SELECT * FROM products WHERE barcode = ? AND pharmacy_id = ?';
    return await dbService.get<Product>(query, [barcode, pharmacyId]);
  }

  // Create new product for a pharmacy
  static async create(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'> & { pharmacy_id: string }): Promise<Product> {
    const id = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const query = `
      INSERT INTO products (id, pharmacy_id, name, buy_price, sell_price, stock, category, description, barcode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await dbService.run(query, [
      id,
      productData.pharmacy_id,
      productData.name,
      productData.buy_price,
      productData.sell_price,
      productData.stock,
      productData.category,
      productData.description || null,
      productData.barcode || null
    ]);

    const newProduct = await this.getById(id, productData.pharmacy_id);
    if (!newProduct) {
      throw new Error('Failed to create product');
    }
    
    return newProduct;
  }

  // Update product for a specific pharmacy
  static async update(id: string, productData: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>, pharmacyId: string): Promise<Product> {
    const fields = [];
    const values = [];

    if (productData.name !== undefined) {
      fields.push('name = ?');
      values.push(productData.name);
    }
    if (productData.buy_price !== undefined) {
      fields.push('buy_price = ?');
      values.push(productData.buy_price);
    }
    if (productData.sell_price !== undefined) {
      fields.push('sell_price = ?');
      values.push(productData.sell_price);
    }
    if (productData.stock !== undefined) {
      fields.push('stock = ?');
      values.push(productData.stock);
    }
    if (productData.category !== undefined) {
      fields.push('category = ?');
      values.push(productData.category);
    }
    if (productData.description !== undefined) {
      fields.push('description = ?');
      values.push(productData.description);
    }
    if (productData.barcode !== undefined) {
      fields.push('barcode = ?');
      values.push(productData.barcode);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    // Add pharmacy_id to WHERE clause to ensure we only update products in the current pharmacy
    values.push(id, pharmacyId);

    const query = `UPDATE products SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND pharmacy_id = ?`;
    await dbService.run(query, values);

    const updatedProduct = await this.getById(id, pharmacyId);
    if (!updatedProduct) {
      throw new Error('Product not found after update');
    }

    return updatedProduct;
  }

  // Delete product from a specific pharmacy
  static async delete(id: string, pharmacyId: string): Promise<void> {
    const query = 'DELETE FROM products WHERE id = ? AND pharmacy_id = ?';
    const result = await dbService.run(query, [id, pharmacyId]);
    
    if (result.changes === 0) {
      throw new Error('Product not found in current pharmacy');
    }
  }

  // Add validation method (unchanged)
  static validateProductData(productData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!productData.name || productData.name.trim() === '') {
      errors.push('Product name is required');
    }
    if (productData.buy_price === undefined || productData.buy_price < 0) {
      errors.push('Valid buy price is required');
    }
    if (productData.sell_price === undefined || productData.sell_price < 0) {
      errors.push('Valid sell price is required');
    }
    if (productData.buy_price > productData.sell_price) {
      errors.push('Sell price must be greater than or equal to buy price');
    }
    if (!productData.category || productData.category.trim() === '') {
      errors.push('Category is required');
    }
    if (productData.stock === undefined || productData.stock < 0) {
      errors.push('Valid stock quantity is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Calculate profit margin (unchanged)
  static calculateMargin(buyPrice: number, sellPrice: number): { amount: number; percentage: number } {
    const amount = sellPrice - buyPrice;
    const percentage = buyPrice > 0 ? (amount / buyPrice) * 100 : 0;
    
    return {
      amount: parseFloat(amount.toFixed(2)),
      percentage: parseFloat(percentage.toFixed(2))
    };
  }

  // Search products in a specific pharmacy
  static async search(searchTerm: string, pharmacyId: string, limit: number = 50): Promise<Product[]> {
    const query = `
      SELECT * FROM products 
      WHERE pharmacy_id = ? AND (name LIKE ? OR category LIKE ? OR barcode LIKE ?)
      ORDER BY 
        CASE 
          WHEN name LIKE ? THEN 1
          WHEN category LIKE ? THEN 2
          ELSE 3
        END,
        name
      LIMIT ?
    `;
    const searchPattern = `%${searchTerm}%`;
    return await dbService.all<Product>(query, [
      pharmacyId,
      searchPattern, searchPattern, searchPattern,
      searchPattern, searchPattern,
      limit
    ]);
  }

  // Update stock with transaction support for a specific pharmacy
  static async updateStock(id: string, newStock: number, pharmacyId: string): Promise<void> {
    if (newStock < 0) {
      throw new Error('Stock cannot be negative');
    }

    const query = 'UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND pharmacy_id = ?';
    const result = await dbService.run(query, [newStock, id, pharmacyId]);
    
    if (result.changes === 0) {
      throw new Error('Product not found in current pharmacy');
    }
  }

  // Get low stock products for a specific pharmacy
  static async getLowStock(threshold: number = 10, pharmacyId: string): Promise<Product[]> {
    const query = 'SELECT * FROM products WHERE stock <= ? AND pharmacy_id = ? ORDER BY stock ASC, name';
    return await dbService.all<Product>(query, [threshold, pharmacyId]);
  }

  // Get products by category for a specific pharmacy
  static async getByCategory(category: string, pharmacyId: string): Promise<Product[]> {
    const query = 'SELECT * FROM products WHERE category = ? AND pharmacy_id = ? ORDER BY name';
    return await dbService.all<Product>(query, [category, pharmacyId]);
  }

  // Get all categories for a specific pharmacy
  static async getCategories(pharmacyId: string): Promise<string[]> {
    const results = await dbService.all<{ category: string }>(
      'SELECT DISTINCT category FROM products WHERE pharmacy_id = ? ORDER BY category', 
      [pharmacyId]
    );
    return results.map(row => row.category);
  }

  // NEW: Get products across all pharmacies (for admin/superuser purposes)
  static async getAllAcrossPharmacies(limit?: number, offset?: number): Promise<Product[]> {
    let query = 'SELECT * FROM products ORDER BY pharmacy_id, name';
    const params: any[] = [];

    if (limit !== undefined) {
      query += ' LIMIT ?';
      params.push(limit);
    }
    if (offset !== undefined) {
      query += ' OFFSET ?';
      params.push(offset);
    }

    return await dbService.all<Product>(query, params);
  }

  // NEW: Check if barcode exists in any pharmacy (for validation)
  static async isBarcodeUnique(barcode: string, pharmacyId: string, excludeProductId?: string): Promise<boolean> {
    if (!barcode) return true; // Empty barcode is always "unique"
    
    let query = 'SELECT COUNT(*) as count FROM products WHERE barcode = ? AND pharmacy_id = ?';
    const params: any[] = [barcode, pharmacyId];
    
    if (excludeProductId) {
      query += ' AND id != ?';
      params.push(excludeProductId);
    }
    
    const result = await dbService.get<{ count: number }>(query, params);
    return result?.count === 0;
  }
}