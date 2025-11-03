import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { useProducts } from '../hooks/useProducts';
import { useBarcode } from '../hooks/useBarcode';
import { apiService } from '../services/api'; 

const Inventory: React.FC = () => {
  const { 
    products, 
    loading, 
    error, 
    addProduct, 
    updateProduct, 
    deleteProduct 
  } = useProducts();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [products, searchTerm]);

  const handleAddProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      console.log('Attempting to add product:', productData);
      await addProduct(productData);
      console.log('Product added successfully');
      setShowAddForm(false);
      setActionError(null);
    } catch (error) {
      console.error('Error adding product:', error);
      setActionError('Failed to add product. Please try again.');
    }
  };

  const handleEditProduct = async (updatedProduct: Product | Omit<Product, 'id'>) => {
    try {
      console.log('Attempting to update product:', updatedProduct);
      await updateProduct(updatedProduct as Product);
      console.log('Product updated successfully');
      setEditingProduct(null);
      setActionError(null);
    } catch (error) {
      console.error('Error updating product:', error);
      setActionError('Failed to update product. Please try again.');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        console.log('Attempting to delete product:', productId);
        await deleteProduct(productId);
        console.log('Product deleted successfully');
        setActionError(null);
      } catch (error) {
        console.error('Error deleting product:', error);
        setActionError('Failed to delete product. Please try again.');
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading products...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Add Product
        </button>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Database Error: {error}
        </div>
      )}

      {actionError && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Action Error: {actionError}
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search products by name, category, or barcode..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No products match your search.' : 'No products found. Add your first product!'}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Buy Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sell Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit Margin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const profitMargin = product.sell_price - product.buy_price;
                const profitPercentage = (profitMargin / product.buy_price) * 100;
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      {product.barcode && (
                        <div className="text-xs text-gray-500">Barcode: {product.barcode}</div>
                      )}
                      {product.description && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {product.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{product.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${product.buy_price.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-900">${product.sell_price.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-900">${profitMargin.toFixed(2)}</div>
                        <div className={`text-xs ${profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ({profitPercentage.toFixed(1)}%)
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.stock > 10 ? 'bg-green-100 text-green-800' : 
                        product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {product.stock} in stock
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(product.updated_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Product Form Modal */}
      {showAddForm && (
        <ProductForm
          onSave={handleAddProduct}
          onCancel={() => {
            setShowAddForm(false);
            setActionError(null);
          }}
          onEditExisting={(prod) => {
            setShowAddForm(false);
            setEditingProduct(prod);
          }}
        />
      )}

      {/* Edit Product Form Modal */}
      {editingProduct && (
        <ProductForm
          product={editingProduct}
          onSave={handleEditProduct}
          onCancel={() => {
            setEditingProduct(null);
            setActionError(null);
          }}
        />
      )}
    </div>
  );
};

// Updated Product Form Component with Barcode Scanner Features
interface ProductFormProps {
  product?: Product;
  onSave: (product: Product | Omit<Product, 'id'>) => Promise<void>;
  onCancel: () => void;
  onEditExisting?: (product: Product) => void; // New prop to handle switching to edit mode
}

const ProductForm: React.FC<ProductFormProps> = ({ 
  product, 
  onSave, 
  onCancel, 
  onEditExisting 
}) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    buy_price: product?.buy_price || 0,
    sell_price: product?.sell_price || 0,
    stock: product?.stock || 0,
    category: product?.category || '',
    description: product?.description || '',
    barcode: product?.barcode || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const { 
    handleBarcodeScan, 
    scannedProduct, 
    clearScannedProduct,
    loading: barcodeScanLoading 
  } = useBarcode();

  // Auto-fill form when product is scanned
  useEffect(() => {
    if (scannedProduct && !product) {
      // Only auto-fill when adding new product (not editing)
      setFormData(prev => ({
        ...prev,
        name: scannedProduct.name,
        buy_price: scannedProduct.buy_price,
        sell_price: scannedProduct.sell_price,
        category: scannedProduct.category,
        description: scannedProduct.description || '',
        barcode: scannedProduct.barcode || formData.barcode
      }));
    }
  }, [scannedProduct, product]);

  // Handle barcode input (from scanner or manual)
  const handleBarcodeInput = async (barcode: string) => {
    if (!barcode.trim()) return;
    
    setBarcodeLoading(true);
    setBarcodeError(null);
    
    try {
      await handleBarcodeScan(barcode);
    } catch (error) {
      setBarcodeError('Failed to process barcode');
    } finally {
      setBarcodeLoading(false);
    }
  };

  // Handle barcode field blur (when user leaves the field)
  const handleBarcodeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const barcode = e.target.value.trim();
    if (barcode && barcode !== product?.barcode) {
      handleBarcodeInput(barcode);
    }
  };

  // Handle form submission with barcode validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.sell_price < formData.buy_price) {
      alert('Sell price cannot be less than buy price!');
      return;
    }
    
    if (formData.buy_price < 0 || formData.sell_price < 0 || formData.stock < 0) {
      alert('Prices and stock cannot be negative!');
      return;
    }

    // Check for duplicate barcode when adding new product
    if (!product && formData.barcode) {
      try {
        const exists = await apiService.checkBarcodeExists(formData.barcode);
        if (exists.exists) {
          const useExisting = confirm(
            `Barcode "${formData.barcode}" already exists for product "${exists.product?.name}".\n\nDo you want to update the existing product instead?`
          );
          if (useExisting && exists.product) {
            onEditExisting?.(exists.product);
            return;
          }
        }
      } catch (error) {
        console.error('Error checking barcode:', error);
      }
    }

    setIsSubmitting(true);
    
    try {
      console.log('Form submitted with data:', formData);
      if (product) {
        await onSave({ ...formData, id: product.id });
      } else {
        await onSave(formData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const profitMargin = formData.sell_price - formData.buy_price;
  const profitPercentage = formData.buy_price > 0 ? (profitMargin / formData.buy_price) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {product ? 'Edit Product' : 'Add New Product'}
        </h3>
        
        {/* Barcode Scanner Status */}
        {scannedProduct && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">
                  📦 Product Found: {scannedProduct.name}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {product ? 'Product details loaded' : 'Auto-filled product details'}
                </p>
              </div>
              <button
                onClick={clearScannedProduct}
                className="text-green-600 hover:text-green-800 text-sm"
                type="button"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {barcodeError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">
              ❌ {barcodeError}
            </p>
            <p className="text-xs text-red-600 mt-1">
              Barcode not found in database
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <input
              type="text"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buy Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.buy_price}
                onChange={(e) => setFormData({ ...formData, buy_price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sell Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.sell_price}
                onChange={(e) => setFormData({ ...formData, sell_price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Profit Margin Display */}
          {formData.buy_price > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Profit Margin:</span>
                  <span className={`font-semibold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${profitMargin.toFixed(2)} ({profitPercentage.toFixed(1)}%)
                  </span>
                </div>
                {profitMargin < 0 && (
                  <div className="text-xs text-red-600 mt-1">
                    Warning: Selling at a loss!
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Quantity *
            </label>
            <input
              type="number"
              min="0"
              required
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Barcode {!product && '(Scan with barcode scanner)'}
            </label>
            <div className="space-y-2">
              <input
                ref={barcodeInputRef}
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                onBlur={handleBarcodeBlur}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
                placeholder="Scan barcode or type manually"
                autoFocus={!product} // Auto-focus on barcode field for new products
              />
              {barcodeScanLoading && (
                <p className="text-sm text-blue-600 flex items-center">
                  <span className="animate-spin mr-2">⟳</span>
                  Searching for product...
                </p>
              )}
              <p className="text-xs text-gray-500">
                💡 Tip: Use your barcode scanner to quickly scan product barcodes. 
                The system will auto-fill product details if the barcode exists.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
              placeholder="Product description..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (product ? 'Update Product' : 'Add Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Inventory;