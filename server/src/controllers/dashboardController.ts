import { Request, Response } from 'express';
import { dbService } from '../models/database';

export class DashboardController {


  // Get dashboard summary (main metrics)
  public static async getDashboardSummary(req: Request, res: Response): Promise<void> {
    try {
      const pharmacyId = req.pharmacyId!;
      console.log('📊 Fetching dashboard summary...');

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // 1. Today's sales summary
      const todaySales = await dbService.get<{
        today_orders: number;
        today_revenue: number;
        today_profit: number;
        today_items_sold: number;
      }>(`
        SELECT 
          COUNT(*) as today_orders,
          COALESCE(SUM(total_amount), 0) as today_revenue,
          COALESCE(SUM(total_profit), 0) as today_profit,
          COALESCE(SUM(
            (SELECT SUM(quantity) FROM sale_items WHERE sale_id = sales.id AND pharmacy_id = ?)
          ), 0) as today_items_sold
        FROM sales 
        WHERE DATE(created_at) = ? AND pharmacy_id = ?
      `, [pharmacyId, today, pharmacyId]);

      // 2. Yesterday's revenue for percentage calculation
      const yesterdayRevenue = await dbService.get<{ revenue: number }>(`
        SELECT COALESCE(SUM(total_amount), 0) as revenue
        FROM sales 
        WHERE DATE(created_at) = ? AND pharmacy_id = ?
      `, [yesterday, pharmacyId]);

      // 3. Total products and categories
      const productsSummary = await dbService.get<{
        total_products: number;
        total_categories: number;
      }>(`
        SELECT 
          COUNT(*) as total_products,
          COUNT(DISTINCT category) as total_categories
        FROM products
        WHERE pharmacy_id = ?
      `, [pharmacyId]);

      // 4. Low stock count (stock <= 10)
      const lowStock = await dbService.get<{ low_stock_count: number }>(`
        SELECT COUNT(*) as low_stock_count 
        FROM products 
        WHERE stock <= 10 AND pharmacy_id = ?
      `, [pharmacyId]);

      // 5. NEW: Get total stock worth (using buy price)
      const stockWorth = await dbService.get<{ total_worth: number }>(`
        SELECT COALESCE(SUM(stock * buy_price), 0) as total_worth 
        FROM products 
        WHERE pharmacy_id = ?
      `, [pharmacyId]);

      // Calculate percentage change
      const revenueChange = yesterdayRevenue?.revenue 
        ? ((todaySales?.today_revenue || 0) - yesterdayRevenue.revenue) / yesterdayRevenue.revenue * 100
        : 0;

      const summary = {
        todayRevenue: todaySales?.today_revenue || 0,
        totalProducts: productsSummary?.total_products || 0,
        lowStockCount: lowStock?.low_stock_count || 0,
        todayOrders: todaySales?.today_orders || 0,
        todayItemsSold: todaySales?.today_items_sold || 0,
        totalCategories: productsSummary?.total_categories || 0,
        revenueChange: Math.round(revenueChange * 100) / 100,  
        todayProfit: todaySales?.today_profit || 0,
        totalStockWorth: stockWorth?.total_worth || 0, // NEW: Add total stock worth
        pharmacyId: pharmacyId // Include pharmacy ID in response for debugging
      };

      console.log(`Dashboard summary for pharmacy ${pharmacyId}:`, summary);

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard summary'
      });
    }
  }

  // Get sales trend data for charts
  public static async getSalesTrend(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const pharmacyId = req.pharmacyId!;
      
      console.log(`📈 Fetching sales trend for last ${days} days for pharmacy ${pharmacyId}...`);

      // Generate date range for the last X days
      const dateRange = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dateRange.push(date.toISOString().split('T')[0]);
      }

      // Get sales data for each day
      const salesData = await dbService.all<{
        date: string;
        revenue: number;
        profit: number;
        orders: number;
      }>(`
        SELECT 
          DATE(created_at) as date,
          COALESCE(SUM(total_amount), 0) as revenue,
          COALESCE(SUM(total_profit), 0) as profit,
          COUNT(*) as orders
        FROM sales 
        WHERE DATE(created_at) >= DATE('now', ? || ' days') AND pharmacy_id = ?
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `, [`-${days}`, pharmacyId]);

      // Format the response to include all dates and date with no sales as well
      const formattedData = dateRange.map(date => {
        const dayData = salesData.find(s => s.date === date);
        return {
          date,
          revenue: dayData?.revenue || 0,
          profit: dayData?.profit || 0,
          orders: dayData?.orders || 0
        };
      });

      const response = {
        labels: formattedData.map(d => {
          const date = new Date(d.date);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        revenue: formattedData.map(d => d.revenue),
        profit: formattedData.map(d => d.profit),
        orders: formattedData.map(d => d.orders),
        pharmacyId: pharmacyId
      };

      console.log(`✅ Sales trend data for pharmacy ${pharmacyId}:`, response);

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      console.error('Error fetching sales trend:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sales trend data'
      });
    }
  }

  // Get category distribution
  public static async getCategoryDistribution(req: Request, res: Response): Promise<void> {
    try {
      const pharmacyId = req.pharmacyId!;
      console.log(`📊 Fetching category distribution for pharmacy ${pharmacyId}...`);

      const categories = await dbService.all<{
        category: string;
        product_count: number;
        total_revenue: number;
      }>(`
        SELECT 
          p.category,
          COUNT(p.id) as product_count,
          COALESCE(SUM(si.total_sell_price), 0) as total_revenue
        FROM products p
        LEFT JOIN sale_items si ON p.id = si.product_id AND si.pharmacy_id = ?
        LEFT JOIN sales s ON si.sale_id = s.id AND s.pharmacy_id = ?
        WHERE p.pharmacy_id = ?
        GROUP BY p.category
        ORDER BY total_revenue DESC
      `, [pharmacyId, pharmacyId, pharmacyId]);

      const response = categories.map(cat => ({
        name: cat.category,
        count: cat.product_count,
        revenue: cat.total_revenue
      }));

      console.log(`✅ Category distribution for pharmacy ${pharmacyId}:`, response);

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      console.error('❌ Error fetching category distribution:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch category distribution'
      });
    }
  }

  // Get recent sales
  public static async getRecentSales(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const pharmacyId = req.pharmacyId!;
      
      console.log(`🔄 Fetching last ${limit} recent sales for pharmacy ${pharmacyId}...`);

      const recentSales = await dbService.all<{
        id: string;
        total_amount: number;
        payment_method: string;
        created_at: string;
        items_count: number;
      }>(`
        SELECT 
          s.id,
          s.total_amount,
          s.payment_method,
          s.created_at,
          (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id AND pharmacy_id = ?) as items_count
        FROM sales s
        WHERE s.pharmacy_id = ?
        ORDER BY s.created_at DESC
        LIMIT ?
      `, [pharmacyId, pharmacyId, limit]);

      const response = recentSales.map(sale => ({
        id: sale.id,
        total_amount: sale.total_amount,
        payment_method: sale.payment_method,
        created_at: sale.created_at,
        items_count: sale.items_count
      }));

      console.log(`✅ Recent sales for pharmacy ${pharmacyId}:`, response);

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      console.error('❌ Error fetching recent sales:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recent sales'
      });
    }
  }

  // Get low stock products
  public static async getLowStockProducts(req: Request, res: Response): Promise<void> {
    try {
      const threshold = parseInt(req.query.threshold as string) || 10;
      const pharmacyId = req.pharmacyId!;
      
      console.log(`⚠️ Fetching low stock products (stock <= ${threshold}) for pharmacy ${pharmacyId}...`);

      const lowStockProducts = await dbService.all<{
        id: string;
        name: string;
        stock: number;
        category: string;
        sell_price: number;
      }>(`
        SELECT 
          id,
          name,
          stock,
          category,
          sell_price
        FROM products 
        WHERE stock <= ? AND pharmacy_id = ?
        ORDER BY stock ASC
        LIMIT 10
      `, [threshold, pharmacyId]);

      const response = lowStockProducts.map(product => ({
        id: product.id,
        name: product.name,
        stock: product.stock,
        category: product.category,
        sell_price: product.sell_price
      }));

      console.log(`✅ Low stock products for pharmacy ${pharmacyId}:`, response);

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      console.error('❌ Error fetching low stock products:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch low stock products'
      });
    }
  }

  // Get total stock worth (using buy price)
  public static async getTotalStockWorth(req: Request, res: Response): Promise<void> {
    try {
      const pharmacyId = req.pharmacyId!;
      const totalWorth = await dbService.getTotalStockWorth(pharmacyId);
      
      res.json({
        success: true,
        data: {
          total_stock_worth: totalWorth
        }
      });
    } catch (error) {
      console.error('Error fetching total stock worth:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch total stock worth'
      });
    }
  }
}