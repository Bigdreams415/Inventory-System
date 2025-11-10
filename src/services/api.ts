import { Product, Sale, CreateSaleRequest, TodaySalesSummary } from '../types';
import { DashboardSummary, SalesTrend, CategoryDistribution, RecentSale, LowStockProduct } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Don't clear auth for verify-token endpoint
          if (!endpoint.includes('/auth/verify-token')) {
            this.clearAuthData();
          }
          throw new Error('Unauthorized. Please login again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }

      return data.data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
  
  // Barcode endpoints
  async getProductByBarcode(barcode: string): Promise<Product> {
    return this.request<Product>(`/products/barcode/${encodeURIComponent(barcode)}`);
  }

  async checkBarcodeExists(barcode: string): Promise<{ exists: boolean; product?: Product }> {
    try {
      const product = await this.getProductByBarcode(barcode);
      return { exists: true, product };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Product not found')) {
        return { exists: false };
      }
      throw error;
    }
  }

  // Product endpoints
  async getProducts(): Promise<Product[]> {
    return this.request<Product[]>('/products');
  }

  async getProductById(id: string): Promise<Product> {
    return this.request<Product>(`/products/${id}`);
  }

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    return this.request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  async deleteProduct(id: string): Promise<void> {
    await this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async searchProducts(query: string): Promise<Product[]> {
    return this.request<Product[]>(`/products/search?q=${encodeURIComponent(query)}`);
  }

  // Sales endpoints
  async createSale(saleData: CreateSaleRequest): Promise<Sale> {
    return this.request<Sale>('/sales', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  }

  async getSales(page: number = 1, limit: number = 50): Promise<{ data: Sale[]; pagination: any }> {
    return this.request<{ data: Sale[]; pagination: any }>(`/sales?page=${page}&limit=${limit}`);
  }

  async getSaleById(id: string): Promise<Sale> {
    return this.request<Sale>(`/sales/${id}`);
  }

  async getTodaySales(): Promise<{ sales: Sale[]; summary: TodaySalesSummary }> {
    return this.request<{ sales: Sale[]; summary: TodaySalesSummary }>('/sales/today');
  }

  // Health check
  async healthCheck(): Promise<{ message: string; timestamp: string }> {
    return this.request('/health');
  }

  // Dashboard endpoints
  async getDashboardSummary(): Promise<DashboardSummary> {
    return this.request<DashboardSummary>('/dashboard/summary');
  }

  async getSalesTrend(days: number = 7): Promise<SalesTrend> {
    return this.request<SalesTrend>(`/dashboard/sales-trend?days=${days}`);
  }

  async getCategoryDistribution(): Promise<CategoryDistribution[]> {
    return this.request<CategoryDistribution[]>('/dashboard/categories');
  }

  async getRecentSales(limit: number = 5): Promise<RecentSale[]> {
    return this.request<RecentSale[]>(`/dashboard/recent-sales?limit=${limit}`);
  }

  async getLowStockProducts(threshold: number = 10): Promise<LowStockProduct[]> {
    return this.request<LowStockProduct[]>(`/dashboard/low-stock?threshold=${threshold}`);
  }

  async getTotalStockWorth(): Promise<{ total_stock_worth: number }> {
    return this.request<{ total_stock_worth: number }>('/dashboard/stock-worth');
  }

  // Authentication
  async login(username: string, password: string): Promise<{ token: string; username: string }> {
    try {
      if (!username?.trim() || !password?.trim()) {
        throw new Error('Please provide both username and password');
      }

      const result = await this.request<{ token: string; username: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (result.token) {
        localStorage.setItem('auth_token', result.token);
        localStorage.setItem('username', result.username);
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          throw new Error('Invalid username or password. Please try again.');
        }
        if (error.message.includes('Network') || error.message.includes('fetch')) {
          throw new Error('Unable to connect to server. Please check your connection.');
        }
      }
      throw new Error('Login failed. Please try again later.');
    }
  }

  async verifyToken(token?: string): Promise<{ valid: boolean; username?: string }> {
    try {
      const authToken = token || localStorage.getItem('auth_token');
      
      console.log('🔐 verifyToken called, token from localStorage:', authToken ? `${authToken.substring(0, 20)}...` : 'No token');
      
      if (!authToken) {
        return { valid: false };
      }

      console.log('📤 Sending token in Authorization header...');
      const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}` // ADD THIS LINE - THIS WAS MISSING!
        },
        body: JSON.stringify({ token: authToken }),
      });

      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        return { valid: false };
      }

      const data = await response.json();
      console.log('✅ Verification response:', data);
      
      if (!data.success) {
        return { valid: false };
      }

      return data.data;
    } catch (error) {
      console.warn('Token verification failed:', error);
      return { valid: false };
    }
  }

  async logout(): Promise<void> {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        await this.request('/auth/logout', {
          method: 'POST',
        });
      }
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.clearAuthData();
    }
  }

  getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  private clearAuthData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('username');
  }
}

export const apiService = new ApiService();