import { useState, useEffect } from 'react';
import { Service, ServiceSale, ServiceStats, ServiceSalesStats } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

// Helper function to get auth headers (same as in api.ts)
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceSales, setServiceSales] = useState<ServiceSale[]>([]);
  const [serviceStats, setServiceStats] = useState<ServiceStats | null>(null);
  const [salesStats, setSalesStats] = useState<ServiceSalesStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all services
  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/services`, {
        headers: getAuthHeaders()
      });
      const result = await response.json();
      
      if (result.success) {
        setServices(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch services');
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  // Fetch service sales
  const fetchServiceSales = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/service-sales`, {
        headers: getAuthHeaders()
      });
      const result = await response.json();
      
      if (result.success) {
        setServiceSales(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch service sales');
      }
    } catch (err) {
      console.error('Error fetching service sales:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch service sales');
    } finally {
      setLoading(false);
    }
  };

  // Fetch service statistics
  const fetchServiceStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/services/stats/summary`, {
        headers: getAuthHeaders()
      });
      const result = await response.json();
      
      if (result.success) {
        setServiceStats(result.data.summary);
      } else {
        throw new Error(result.error || 'Failed to fetch service stats');
      }
    } catch (err) {
      console.error('Error fetching service stats:', err);
    }
  };

  // Fetch service sales statistics
  const fetchSalesStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/service-sales/stats/revenue`, {
        headers: getAuthHeaders()
      });
      const result = await response.json();
      
      if (result.success) {
        setSalesStats(result.data.summary);
      } else {
        throw new Error(result.error || 'Failed to fetch sales stats');
      }
    } catch (err) {
      console.error('Error fetching sales stats:', err);
    }
  };

  // Create new service
  const createService = async (serviceData: {
    name: string;
    category: string;
    description: string;
    price: number;
    duration: number;
  }): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/services`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(serviceData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchServices(); // Refresh services list
        await fetchServiceStats(); // Refresh stats
        return true;
      } else {
        throw new Error(result.error || 'Failed to create service');
      }
    } catch (err) {
      console.error('Error creating service:', err);
      setError(err instanceof Error ? err.message : 'Failed to create service');
      return false;
    }
  };

  // Update service
  const updateService = async (serviceId: string, updates: {
    name?: string;
    category?: string;
    description?: string;
    price?: number;
    duration?: number;
  }): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchServices(); // Refresh services list
        return true;
      } else {
        throw new Error(result.error || 'Failed to update service');
      }
    } catch (err) {
      console.error('Error updating service:', err);
      setError(err instanceof Error ? err.message : 'Failed to update service');
      return false;
    }
  };

  // Delete service
  const deleteService = async (serviceId: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchServices(); // Refresh services list
        await fetchServiceStats(); // Refresh stats
        return true;
      } else {
        throw new Error(result.error || 'Failed to delete service');
      }
    } catch (err) {
      console.error('Error deleting service:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete service');
      return false;
    }
  };

  // Toggle service status
  const toggleServiceStatus = async (serviceId: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/services/${serviceId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchServices(); // Refresh services list
        return true;
      } else {
        throw new Error(result.error || 'Failed to update service status');
      }
    } catch (err) {
      console.error('Error toggling service status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update service status');
      return false;
    }
  };

  // Record service sale
  const recordServiceSale = async (saleData: {
    service_id: string;
    quantity: number;
    unit_price: number;
    served_by: string;
    notes?: string;
  }): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/service-sales`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(saleData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchServiceSales(); // Refresh sales list
        await fetchSalesStats(); // Refresh sales stats
        return true;
      } else {
        throw new Error(result.error || 'Failed to record service sale');
      }
    } catch (err) {
      console.error('Error recording service sale:', err);
      setError(err instanceof Error ? err.message : 'Failed to record service sale');
      return false;
    }
  };

  // Load all data on component mount
  useEffect(() => {
    fetchServices();
    fetchServiceSales();
    fetchServiceStats();
    fetchSalesStats();
  }, []);

  return {
    // Data
    services,
    serviceSales,
    serviceStats,
    salesStats,
    loading,
    error,
    
    // Actions
    fetchServices,
    fetchServiceSales,
    fetchServiceStats,
    fetchSalesStats,
    createService,
    updateService,
    deleteService,
    toggleServiceStatus,
    recordServiceSale,
    
    // Helper to refresh all data
    refreshAll: () => {
      fetchServices();
      fetchServiceSales();
      fetchServiceStats();
      fetchSalesStats();
    }
  };
};