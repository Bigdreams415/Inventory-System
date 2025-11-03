import { useState } from 'react';
import { Sale, CreateSaleRequest } from '../types';
import { apiService } from '../services/api';

export const useSales = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSale = async (saleData: CreateSaleRequest): Promise<Sale> => {
    setLoading(true);
    setError(null);
    try {
      const sale = await apiService.createSale(saleData);
      return sale;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process sale';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getSales = async (page: number = 1, limit: number = 50) => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.getSales(page, limit);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sales';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTodaySales = async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.getTodaySales();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch today sales';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createSale,
    getSales,
    getTodaySales,
  };
};