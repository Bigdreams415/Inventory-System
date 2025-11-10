export interface Product {
  id: string;
  pharmacy_id: string;
  name: string;
  buy_price: number;
  sell_price: number;
  stock: number;
  category: string;
  description?: string;
  barcode?: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
}
export interface SaleItem {
  id: string;
  pharmacy_id: string;
  sale_id: string;
  product_id: string;
  product_name: string; 
  quantity: number;
  unit_sell_price: number;
  unit_buy_price: number;
  total_sell_price: number;
  item_profit: number;
  created_at: string;
  product?: Product;  
}

export interface Sale {
  id: string;
  pharmacy_id: string;
  total_amount: number;
  total_profit: number;
  payment_method: 'cash' | 'card' | 'transfer';
  status: 'completed' | 'refunded';
  created_at: string;
  items?: SaleItem[];  
}

export interface CreateSaleRequest {
  items: Array<{
    product_id: string;
    quantity: number;
    unit_sell_price: number;
  }>;
  payment_method: 'cash' | 'card' | 'transfer';
}

export interface SaleWithItems extends Sale {
  items: SaleItem[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  created_at: string;
}

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

// service related types

// Add these to your existing types/index.ts

export interface Service {
  id: string;
  pharmacy_id: string;
  name: string;
  category: string; // Flexible - no hardcoded values
  description?: string;
  price: number;
  duration: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceSale {
  id: string;
  pharmacy_id: string;
  service_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  served_by: string;
  notes?: string;
  created_at: string;
  service_name?: string;
  service_category?: string;
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