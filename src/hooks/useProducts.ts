import { useState, useEffect } from 'react';
import { Product } from '../types';

declare global {
  interface Window {
    electronAPI: {
      getProducts: () => Promise<Product[]>;
      createProduct: (product: Omit<Product, 'id'>) => Promise<Product>;
      updateProduct: (product: Product) => Promise<void>;
      deleteProduct: (id: string) => Promise<void>;
      searchProducts: (searchTerm: string) => Promise<Product[]>;
    };
  }
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all products
  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await window.electronAPI.getProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Add new product
  const addProduct = async (product: Omit<Product, 'id'>) => {
    setError(null);
    try {
      const newProduct = await window.electronAPI.createProduct(product);
      setProducts(prev => [...prev, newProduct]);
      return newProduct;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add product');
      throw err;
    }
  };

  // Update product
  const updateProduct = async (product: Product) => {
    setError(null);
    try {
      await window.electronAPI.updateProduct(product);
      setProducts(prev => prev.map(p => p.id === product.id ? product : p));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
      throw err;
    }
  };

  // Delete product
  const deleteProduct = async (id: string) => {
    setError(null);
    try {
      await window.electronAPI.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
      throw err;
    }
  };

  // Search products
  const searchProducts = async (searchTerm: string): Promise<Product[]> => {
    setError(null);
    try {
      return await window.electronAPI.searchProducts(searchTerm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search products');
      throw err;
    }
  };

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  return {
    products,
    loading,
    error,
    loadProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    searchProducts
  };
};
