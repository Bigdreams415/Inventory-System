import { Product, Sale, CreateSaleRequest, TodaySalesSummary } from '../types';
import { DashboardSummary, SalesTrend, CategoryDistribution, RecentSale, LowStockProduct } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
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
}

export const apiService = new ApiService();