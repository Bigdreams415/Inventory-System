import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

// Types for dashboard data
export interface DashboardSummary {
  todayRevenue: number;
  totalProducts: number;
  lowStockCount: number;
  todayOrders: number;
  todayItemsSold: number;
  totalCategories: number;
  revenueChange: number;
  todayProfit: number;
}

export interface SalesTrend {
  labels: string[];
  revenue: number[];
  profit: number[];
  orders: number[];
}

export interface CategoryDistribution {
  name: string;
  count: number;
  revenue: number;
}

export interface RecentSale {
  id: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  items_count: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  category: string;
  sell_price: number;
}

export const useDashboard = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrend | null>(null);
  const [categories, setCategories] = useState<CategoryDistribution[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading dashboard data...');
      
      // Load all data in parallel for better performance
      const [
        summaryResponse,
        salesTrendResponse,
        categoriesResponse,
        recentSalesResponse,
        lowStockResponse
      ] = await Promise.all([
        apiService.getDashboardSummary(),
        apiService.getSalesTrend(7),
        apiService.getCategoryDistribution(),
        apiService.getRecentSales(5),
        apiService.getLowStockProducts(10)
      ]);

      console.log('Dashboard data loaded successfully');
      
      setSummary(summaryResponse);
      setSalesTrend(salesTrendResponse);
      setCategories(categoriesResponse);
      setRecentSales(recentSalesResponse);
      setLowStockProducts(lowStockResponse);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      console.error('❌ Error loading dashboard data:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load specific data 
  const loadSummary = async () => {
    try {
      const data = await apiService.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      console.error('Error loading summary:', err);
    }
  };

  const loadSalesTrend = async (days: number = 7) => {
    try {
      const data = await apiService.getSalesTrend(days);
      setSalesTrend(data);
    } catch (err) {
      console.error('Error loading sales trend:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await apiService.getCategoryDistribution();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadRecentSales = async (limit: number = 5) => {
    try {
      const data = await apiService.getRecentSales(limit);
      setRecentSales(data);
    } catch (err) {
      console.error('Error loading recent sales:', err);
    }
  };

  const loadLowStockProducts = async (threshold: number = 10) => {
    try {
      const data = await apiService.getLowStockProducts(threshold);
      setLowStockProducts(data);
    } catch (err) {
      console.error('Error loading low stock products:', err);
    }
  };

  // Refresh all data
  const refreshDashboard = async () => {
    await loadDashboardData();
  };

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  return {
    // Data
    summary,
    salesTrend,
    categories,
    recentSales,
    lowStockProducts,
    
    // Loading states
    loading,
    error,
    
    // Actions
    refreshDashboard,
    loadSummary,
    loadSalesTrend,
    loadCategories,
    loadRecentSales,
    loadLowStockProducts
  };
};