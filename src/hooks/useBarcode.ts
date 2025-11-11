import { useState, useRef, useCallback } from 'react';
import { Product } from '../types';
import { apiService } from '../services/api';

export const useBarcode = () => {
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const barcodeInputRef = useRef<string>('');


  // Handle barcode input from scanner (scanners send data quickly with Enter at the end)
  const handleBarcodeScan = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return;

    setLoading(true);
    setError(null);
    barcodeInputRef.current = ''; // Reset the buffer
    
    try {
      console.log('🔍 Scanning barcode:', barcode);
      const product = await apiService.getProductByBarcode(barcode);
      setScannedProduct(product);
      console.log('✅ Product found:', product.name);
      
      // Auto-clear success after 3 seconds
      setTimeout(() => {
        setScannedProduct(null);
      }, 3000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to scan barcode';
      setError(errorMessage);
      setScannedProduct(null);
      console.log('❌ Barcode not found:', barcode);
      
      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      setLoading(false);
    }
  }, []);

  // For manual barcode input (keyboard typing)
  const handleManualBarcodeInput = async (barcode: string) => {
    await handleBarcodeScan(barcode);
  };

  // Check if barcode exists (for duplicate checking when adding new products)
  const checkBarcodeExists = async (barcode: string): Promise<boolean> => {
    if (!barcode.trim()) return false;
    
    try {
      const result = await apiService.checkBarcodeExists(barcode);
      return result.exists;
    } catch (error) {
      console.error('Error checking barcode:', error);
      return false;
    }
  };

  // Clear scanned product
  const clearScannedProduct = () => {
    setScannedProduct(null);
    setError(null);
  };

  return {
    scannedProduct,
    error,
    loading,
    handleBarcodeScan,
    handleManualBarcodeInput,
    checkBarcodeExists,
    clearScannedProduct
  };
};