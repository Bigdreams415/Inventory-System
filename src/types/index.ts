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