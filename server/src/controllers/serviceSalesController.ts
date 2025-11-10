import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '../models/database';
import { ServiceSale, CreateServiceSaleRequest, ServiceSalesStats, TopService } from '../types';

export class ServiceSalesController {
  // Get all service sales for current pharmacy
  public static async getServiceSales(req: Request, res: Response): Promise<void> {
    try {
      const pharmacyId = req.pharmacyId!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const sales = await dbService.all(`
        SELECT 
          ss.*,
          s.name as service_name,
          s.category as service_category
        FROM service_sales ss
        LEFT JOIN services s ON ss.service_id = s.id AND s.pharmacy_id = ?
        WHERE ss.pharmacy_id = ?
        ORDER BY ss.created_at DESC
        LIMIT ? OFFSET ?
      `, [pharmacyId, pharmacyId, limit, offset]);

      // Get total count
      const totalResult = await dbService.get<{ count: number }>(`
        SELECT COUNT(*) as count FROM service_sales WHERE pharmacy_id = ?
      `, [pharmacyId]);

      const total = totalResult?.count || 0;

      res.json({
        success: true,
        data: sales,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching service sales:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch service sales'
      });
    }
  }

  // Create new service sale
  public static async createServiceSale(req: Request, res: Response): Promise<void> {
    try {
      const pharmacyId = req.pharmacyId!;
      const { service_id, quantity, unit_price, served_by, notes }: CreateServiceSaleRequest = req.body;

      // Validate input
      if (!service_id || !served_by || quantity === undefined || unit_price === undefined) {
        res.status(400).json({
          success: false,
          error: 'Service ID, quantity, unit price, and served by are required'
        });
        return;
      }

      if (quantity <= 0) {
        res.status(400).json({
          success: false,
          error: 'Quantity must be greater than 0'
        });
        return;
      }

      if (unit_price < 0) {
        res.status(400).json({
          success: false,
          error: 'Unit price must be a positive number'
        });
        return;
      }

      // Check if service exists and is active
      const service = await dbService.get(`
        SELECT * FROM services WHERE id = ? AND pharmacy_id = ? AND is_active = 1
      `, [service_id, pharmacyId]);

      if (!service) {
        res.status(404).json({
          success: false,
          error: 'Service not found or inactive'
        });
        return;
      }

      const saleId = uuidv4();
      const total_amount = unit_price * quantity;

      await dbService.run(`
        INSERT INTO service_sales (id, pharmacy_id, service_id, quantity, unit_price, total_amount, served_by, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [saleId, pharmacyId, service_id, quantity, unit_price, total_amount, served_by, notes || '']);

      // Get the created sale with service details
      const sale = await dbService.get<ServiceSale & { service_name: string; service_category: string }>(`
        SELECT 
          ss.*,
          s.name as service_name,
          s.category as service_category
        FROM service_sales ss
        LEFT JOIN services s ON ss.service_id = s.id
        WHERE ss.id = ? AND ss.pharmacy_id = ?
      `, [saleId, pharmacyId]);

      res.status(201).json({
        success: true,
        data: sale,
        message: 'Service sale recorded successfully'
      });
    } catch (error) {
      console.error('Error creating service sale:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to record service sale'
      });
    }
  }

  // Get service sales statistics
  public static async getServiceSalesStats(req: Request, res: Response): Promise<void> {
    try {
      const pharmacyId = req.pharmacyId!;
      const today = new Date().toISOString().split('T')[0];

      const stats = await dbService.get<ServiceSalesStats>(`
        SELECT 
          COUNT(*) as total_sales,
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(SUM(quantity), 0) as total_services_sold,
          COUNT(DISTINCT service_id) as unique_services_sold
        FROM service_sales 
        WHERE pharmacy_id = ?
      `, [pharmacyId]);

      const todayStats = await dbService.get<{ today_sales: number; today_revenue: number }>(`
        SELECT 
          COUNT(*) as today_sales,
          COALESCE(SUM(total_amount), 0) as today_revenue
        FROM service_sales 
        WHERE pharmacy_id = ? AND DATE(created_at) = ?
      `, [pharmacyId, today]);

      const topServices = await dbService.all<TopService>(`
        SELECT 
          s.name as service_name,
          s.category,
          COUNT(ss.id) as sale_count,
          SUM(ss.total_amount) as total_revenue
        FROM service_sales ss
        LEFT JOIN services s ON ss.service_id = s.id AND s.pharmacy_id = ?
        WHERE ss.pharmacy_id = ?
        GROUP BY ss.service_id
        ORDER BY total_revenue DESC
        LIMIT 5
      `, [pharmacyId, pharmacyId]);

      res.json({
        success: true,
        data: {
          summary: {
            ...stats,
            ...todayStats
          },
          top_services: topServices
        }
      });
    } catch (error) {
      console.error('Error fetching service sales stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch service sales statistics'
      });
    }
  }

  // Get today's service sales
  public static async getTodayServiceSales(req: Request, res: Response): Promise<void> {
    try {
      const pharmacyId = req.pharmacyId!;
      const today = new Date().toISOString().split('T')[0];

      const sales = await dbService.all<ServiceSale & { service_name: string; service_category: string }>(`
        SELECT 
          ss.*,
          s.name as service_name,
          s.category as service_category
        FROM service_sales ss
        LEFT JOIN services s ON ss.service_id = s.id AND s.pharmacy_id = ?
        WHERE ss.pharmacy_id = ? AND DATE(ss.created_at) = ?
        ORDER BY ss.created_at DESC
      `, [pharmacyId, pharmacyId, today]);

      res.json({
        success: true,
        data: sales
      });
    } catch (error) {
      console.error('Error fetching today service sales:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch today service sales'
      });
    }
  }
}