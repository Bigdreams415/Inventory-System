export interface Product {
  id: string;
  name: string;
  price: number;
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
}

export interface Sale {
  id: string;
  items: CartItem[];
  total: number;
  tax: number;
  discount: number;
  final_total: number;
  payment_method: 'cash' | 'card' | 'transfer';
  customer_name?: string;
  customer_phone?: string;
  created_at: string;
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

export interface Pharmacy {
  id: string;
  name: string;
  location: string;
  address?: string;
  phone_number?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePharmacyRequest {
  name: string;
  location: string;
  address?: string;
  phone_number?: string;
  email?: string;
}

export interface UpdatePharmacyRequest {
  name?: string;
  location?: string;
  address?: string;
  phone_number?: string;
  email?: string;
  is_active?: boolean;
}