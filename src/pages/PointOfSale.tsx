import React, { useState, useEffect } from 'react';
import { Product, CartItem } from '../types';
import { useProducts } from '../hooks/useProducts';
import { useSales } from '../hooks/useSales';
import { useBarcode } from '../hooks/useBarcode';

const PointOfSale: React.FC = () => {
  const { products, loading: productsLoading, error: productsError } = useProducts();
  const { createSale, loading: salesLoading, error: salesError } = useSales();
  const { handleBarcodeScan, scannedProduct, clearScannedProduct, loading: barcodeLoading, error: barcodeError } = useBarcode();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [saleSuccess, setSaleSuccess] = useState<string | null>(null);

  // Get unique categories for filter
  const categories = ['all', ...Array.from(new Set(products.map(product => product.category)))];

  // Filter products based on search and category
  useEffect(() => {
    let filtered = products;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory]);

  // Auto-add scanned product to cart
  useEffect(() => {
    if (scannedProduct && !productsLoading) {
      addToCart(scannedProduct);
      setSearchTerm('');
      // Clear the scanned product after a brief delay to allow UI feedback
      setTimeout(() => clearScannedProduct(), 1500);
    }
  }, [scannedProduct, productsLoading]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (saleSuccess) {
      const timer = setTimeout(() => setSaleSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [saleSuccess]);

  // Function to add product to cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('Product is out of stock!');
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id);
      if (existingItem) {
        if (existingItem.quantity + 1 > product.stock) {
          alert(`Only ${product.stock} items available in stock!`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { 
        product, 
        quantity: 1,
        unit_price: product.sell_price
      }];
    });
  };

  // Function to remove item from cart
  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  // Function to update quantity
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return removeFromCart(productId);

    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.stock) {
      alert(`Only ${product.stock} items available in stock!`);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const totalProfit = cart.reduce((sum, item) => {
    const profitPerItem = item.unit_price - item.product.buy_price;
    return sum + (profitPerItem * item.quantity);
  }, 0);

  // Function to process sale
  const handleProcessSale = async () => {
    if (cart.length === 0) return;
    setShowPaymentModal(true);
  };

  // Function to confirm and process sale
  const confirmSale = async () => {
    try {
      // Prepare sale data for API
      const saleData = {
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_sell_price: item.unit_price
        })),
        payment_method: paymentMethod
      };

      // Send to backend
      const result = await createSale(saleData);
      
      // Success!
      setSaleSuccess(`Sale processed successfully! Total: $${result.total_amount.toFixed(2)}`);
      setCart([]);
      setShowPaymentModal(false);
      setPaymentMethod('cash');
      
    } catch (error) {
      // Error is handled by the useSales hook
      console.error('Sale processing error:', error);
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  // Handle Enter key for barcode scan in search input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      e.preventDefault();
      handleBarcodeScan(searchTerm.trim());
    }
  };

  if (productsLoading && products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading products...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Point of Sale</h2>
      
      {/* Success Message */}
      {saleSuccess && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {saleSuccess}
        </div>
      )}

      {/* Error Messages */}
      {productsError && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Products Error: {productsError}
        </div>
      )}

      {salesError && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Sales Error: {salesError}
        </div>
      )}

      {/* Barcode Scanner Status */}
      {barcodeLoading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 flex items-center">
            <span className="animate-spin mr-2">⟳</span>
            Scanning barcode...
          </p>
        </div>
      )}

      {barcodeError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800">
            ❌ {barcodeError}
          </p>
          <p className="text-xs text-red-600 mt-1">
            Product not found. Please check the barcode and try again.
          </p>
        </div>
      )}

      {scannedProduct && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">
                📦 Added to cart: {scannedProduct.name}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Price: ${scannedProduct.sell_price.toFixed(2)} | Stock: {scannedProduct.stock}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search products by name, category, or scan barcode to add..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
        
        {(searchTerm || selectedCategory !== 'all') && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Filtered by:</span>
            {searchTerm && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Search: "{searchTerm}"
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                Category: {selectedCategory}
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Products Grid */}
        <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">
            Products ({filteredProducts.length})
          </h3>
          
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || selectedCategory !== 'all' 
                ? 'No products match your filters.' 
                : 'No products available.'}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`bg-gray-50 rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    product.stock > 0 
                      ? 'hover:bg-gray-100 hover:shadow-md' 
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => product.stock > 0 && addToCart(product)}
                >
                  <p className="font-medium text-gray-800">{product.name}</p>
                  <p className="text-sm text-gray-600">${product.sell_price.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">
                    Stock: {product.stock} | 
                    Cost: ${product.buy_price.toFixed(2)}
                  </p>
                  {product.stock <= 0 && (
                    <p className="text-xs text-red-600 mt-1">Out of Stock</p>
                  )}
                  {product.stock > 0 && product.stock <= 5 && (
                    <p className="text-xs text-yellow-600 mt-1">Low Stock</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)
            </h3>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear Cart
              </button>
            )}
          </div>
          
          <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Cart is empty</p>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between border-b pb-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.product.name}</p>
                    <p className="text-xs text-gray-600">
                      ${item.unit_price.toFixed(2)} × {item.quantity}
                    </p>
                    <p className="text-xs text-green-600">
                      Profit: ${((item.unit_price - item.product.buy_price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span className="text-sm w-8 text-center">{item.quantity}</span>
                    <button
                      className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    >
                      +
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700 ml-2"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals and Checkout */}
          <div className="mt-6 space-y-3 border-t pt-4">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Estimated Profit:</span>
              <span>${totalProfit.toFixed(2)}</span>
            </div>
            
            <button
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mt-4"
              onClick={handleProcessSale}
              disabled={cart.length === 0 || salesLoading}
            >
              {salesLoading ? 'Processing...' : 'Process Sale'}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
            
            <div className="space-y-3 mb-6">
              {(['cash', 'card', 'transfer'] as const).map((method) => (
                <label key={method} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="capitalize">{method}</span>
                </label>
              ))}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Total Amount:</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>Estimated Profit:</span>
                <span className="font-semibold">${totalProfit.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                disabled={salesLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmSale}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                disabled={salesLoading}
              >
                {salesLoading ? 'Processing...' : 'Confirm Sale'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointOfSale;