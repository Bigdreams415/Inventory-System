import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '../models/database';
import { Sale, SaleItem, CreateSaleRequest, SaleWithItems, ApiResponse } from '../types';

export class SaleController {
  // Create a new sale
  public static async createSale(req: Request, res: Response): Promise<void> {
    try {
      const { items, payment_method }: CreateSaleRequest = req.body;

      console.log('Received sale request:', { items, payment_method });

      // Validate input
      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Sale must contain at least one item'
        });
        return;
      }

      if (!payment_method || !['cash', 'card', 'transfer'].includes(payment_method)) {
        res.status(400).json({
          success: false,
          error: 'Valid payment method is required (cash, card, transfer)'
        });
        return;
      }

      const saleId = uuidv4();
      let totalAmount = 0;
      let totalProfit = 0;

      // Use transaction to ensure data consistency
      const result = await dbService.transaction(async (db) => {
        // First, validate all products exist and have sufficient stock
        for (const item of items) {
          const product = await new Promise<any>((resolve, reject) => {
            db.get(
              'SELECT id, name, buy_price, sell_price, stock FROM products WHERE id = ?',
              [item.product_id],
              (err, row) => {
                if (err) reject(err);
                else resolve(row);
              }
            );
          });

          console.log('Product lookup for ID:', item.product_id, 'Result:', product);

          if (!product) {
            throw new Error(`Product not found with ID: ${item.product_id}. Please refresh the product list.`);
          }

          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
          }
        }

        // ✅ FIX: Create sale record FIRST before any sale items
        await new Promise<void>((resolve, reject) => {
          db.run(
            'INSERT INTO sales (id, total_amount, total_profit, payment_method) VALUES (?, ?, ?, ?)',
            [saleId, 0, 0, payment_method], // Start with 0 values, update later
            (err) => {
              if (err) {
                console.error('Error inserting sale:', err);
                reject(err);
              } else {
                resolve();
              }
            }
          );
        });

        // Now process each sale item (sale exists now)
        for (const item of items) {
          // Get product details again within transaction
          const product = await new Promise<any>((resolve, reject) => {
            db.get(
              'SELECT id, name, buy_price, sell_price, stock FROM products WHERE id = ?',
              [item.product_id],
              (err, row) => {
                if (err) reject(err);
                else resolve(row);
              }
            );
          });

          // Calculate prices and profit
          const unitBuyPrice = product.buy_price;
          const unitSellPrice = item.unit_sell_price;
          const totalSellPrice = unitSellPrice * item.quantity;
          const itemProfit = (unitSellPrice - unitBuyPrice) * item.quantity;

          totalAmount += totalSellPrice;
          totalProfit += itemProfit;

          console.log('Creating sale item:', {
            productId: item.product_id,
            quantity: item.quantity,
            unitSellPrice,
            totalSellPrice,
            itemProfit
          });

          // ✅ Now the sale exists, so foreign key constraint will work
          const saleItemId = uuidv4();
          await new Promise<void>((resolve, reject) => {
            db.run(
              `INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_sell_price, unit_buy_price, total_sell_price, item_profit) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [saleItemId, saleId, item.product_id, item.quantity, unitSellPrice, unitBuyPrice, totalSellPrice, itemProfit],
              (err) => {
                if (err) {
                  console.error('Error inserting sale item:', err);
                  reject(err);
                } else {
                  resolve();
                }
              }
            );
          });

          // Update product stock
          await new Promise<void>((resolve, reject) => {
            db.run(
              'UPDATE products SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              [item.quantity, item.product_id],
              (err) => {
                if (err) {
                  console.error('Error updating product stock:', err);
                  reject(err);
                } else {
                  resolve();
                }
              }
            );
          });
        }

        // ✅ Update sale with final calculated totals
        await new Promise<void>((resolve, reject) => {
          db.run(
            'UPDATE sales SET total_amount = ?, total_profit = ? WHERE id = ?',
            [totalAmount, totalProfit, saleId],
            (err) => {
              if (err) {
                console.error('Error updating sale totals:', err);
                reject(err);
              } else {
                resolve();
              }
            }
          );
        });

        return { saleId, totalAmount, totalProfit };
      });

      // Get the complete sale with items for response
      const sale = await SaleController.getSaleWithItems(saleId);

      console.log('Sale completed successfully:', saleId);

      res.status(201).json({
        success: true,
        data: sale,
        message: 'Sale completed successfully'
      });

    } catch (error) {
      console.error('Error creating sale:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create sale'
      });
    }
  }

  // Get all sales with pagination
// Get all sales with pagination
    public static async getSales(req: Request, res: Response): Promise<void> {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = (page - 1) * limit;

        // Get sales with their items
        const sales = await dbService.all<Sale & { items?: SaleItem[]; sale_items?: string }>(`
        SELECT 
            s.*,
            GROUP_CONCAT(
            json_object(
                'id', si.id,
                'product_id', si.product_id,
                'quantity', si.quantity,
                'unit_sell_price', si.unit_sell_price,
                'unit_buy_price', si.unit_buy_price,
                'total_sell_price', si.total_sell_price,
                'item_profit', si.item_profit,
                'product_name', p.name
            )
            ) as sale_items
        FROM sales s
        LEFT JOIN sale_items si ON s.id = si.sale_id
        LEFT JOIN products p ON si.product_id = p.id
        GROUP BY s.id
        ORDER BY s.created_at DESC 
        LIMIT ? OFFSET ?
        `, [limit, offset]);

        // Parse the sale_items JSON strings
        const salesWithItems = sales.map(sale => ({
        ...sale,
        items: sale.sale_items ? JSON.parse(`[${sale.sale_items}]`) : []
        }));

        const totalResult = await dbService.get<{ count: number }>('SELECT COUNT(*) as count FROM sales');
        const total = totalResult?.count || 0;

        res.json({
        success: true,
        data: salesWithItems,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
        });
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({
        success: false,
        error: 'Failed to fetch sales'
        });
    }
    }

  // Get sale by ID with items
  public static async getSaleById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const sale = await SaleController.getSaleWithItems(id);
      
      if (!sale) {
        res.status(404).json({
          success: false,
          error: 'Sale not found'
        });
        return;
      }

      res.json({
        success: true,
        data: sale
      });
    } catch (error) {
      console.error('Error fetching sale:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sale'
      });
    }
  }

  // Get today's sales summary
  public static async getTodaySales(req: Request, res: Response): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const sales = await dbService.all<Sale>(
        `SELECT * FROM sales 
         WHERE DATE(created_at) = ? 
         ORDER BY created_at DESC`,
        [today]
      );

      const summary = await dbService.get<{ total_sales: number; total_amount: number; total_profit: number }>(
        `SELECT 
           COUNT(*) as total_sales,
           COALESCE(SUM(total_amount), 0) as total_amount,
           COALESCE(SUM(total_profit), 0) as total_profit
         FROM sales 
         WHERE DATE(created_at) = ?`,
        [today]
      );

      res.json({
        success: true,
        data: {
          sales,
          summary: {
            totalSales: summary?.total_sales || 0,
            totalAmount: summary?.total_amount || 0,
            totalProfit: summary?.total_profit || 0
          }
        }
      });
    } catch (error) {
      console.error('Error fetching today sales:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch today sales'
      });
    }
  }

    // Helper method to get sale with items
    private static async getSaleWithItems(saleId: string): Promise<SaleWithItems | null> {
        try {
            const sale = await dbService.get<Sale>('SELECT * FROM sales WHERE id = ?', [saleId]);
            
            if (!sale) {
            return null;
            }

            const items = await dbService.all<SaleItem & { product_name: string }>(`
            SELECT 
                si.*,
                p.name as product_name
            FROM sale_items si 
            LEFT JOIN products p ON si.product_id = p.id 
            WHERE si.sale_id = ?
            `, [saleId]);

            return {
            ...sale,
            items: items.map(item => {
                const { product_name, ...itemWithoutProductName } = item;
                return itemWithoutProductName;
            })
            };
            } catch (error) {
                throw error;
            }
        }
    }