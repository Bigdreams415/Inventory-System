export interface Product {
  id: string;
  name: string;
  buy_price: number;
  sell_price: number;
  stock: number;
  category: string;
  description?: string;
  barcode?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
}

export interface SaleItem {
  product_id: string;
  quantity: number;
  unit_sell_price: number;
}

export interface CreateSaleRequest {
  items: SaleItem[];
  payment_method: 'cash' | 'card' | 'transfer';
}

export interface Sale {
  id: string;
  total_amount: number;
  total_profit: number;
  payment_method: 'cash' | 'card' | 'transfer';
  status: 'completed' | 'refunded';
  created_at: string;
  items?: Array<{
    id: string;
    product_id: string;
    quantity: number;
    unit_sell_price: number;
    unit_buy_price: number;
    total_sell_price: number;
    item_profit: number;
    product_name: string;
    product?: {
      id: string;
      name: string;
    };
  }>;
}

export interface TodaySalesSummary {
  totalSales: number;
  totalAmount: number;
  totalProfit: number;
  saless: Sale[];
}

// Dashboard types
export interface DashboardSummary {
  todayRevenue: number;
  totalProducts: number;
  lowStockCount: number;
  todayOrders: number;
  todayItemsSold: number;
  totalCategories: number;
  revenueChange: number;
  todayProfit: number;
  totalStockWorth: number;
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

// ========== SERVICE TYPES ==========

export interface Service {
  id: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  duration: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ServiceSale {
  id: string;
  service_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  served_by: string;
  notes?: string;
  created_at: string;
  service_name?: string;
  service_category?: string;
  service?: Service;
}

export interface CreateServiceRequest {
  name: string;
  category: string;
  description?: string;
  price: number;
  duration: number;
}

export interface UpdateServiceRequest {
  name?: string;
  category?: string;
  description?: string;
  price?: number;
  duration?: number;
}

export interface CreateServiceSaleRequest {
  service_id: string;
  quantity: number;
  unit_price: number;
  served_by: string;
  notes?: string;
}

export interface ServiceStats {
  total_services: number;
  active_services: number;
  inactive_services: number;
  total_categories: number;
}

export interface ServiceSalesStats {
  total_sales: number;
  total_revenue: number;
  total_services_sold: number;
  unique_services_sold: number;
  today_sales: number;
  today_revenue: number;
}

export interface TopService {
  service_name: string;
  category: string;
  sale_count: number;
  total_revenue: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}