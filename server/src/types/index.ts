export interface Product {
  id: string;
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
  sale_id: string;
  product_id: string;
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