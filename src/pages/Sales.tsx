import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Sale } from '../types';
import { useSales } from '../hooks/useSales';

const Sales: React.FC = () => {
  //eslint-disable-next-line react-hooks/exhaustive-deps
  const { getSales, } = useSales();
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState<boolean>(false);

  const loadSales = async () => {
    try {
      const response = await getSales(1, 50);
      let salesData: Sale[] = [];
      
      if (Array.isArray(response)) {
        salesData = response;
      } else if (response && typeof response === 'object') {
        salesData = response.data || [];
      }
      
      console.log('📊 Loaded sales:', salesData.length);
      setSales(salesData);
    } catch (error) {
      console.error('Failed to load sales:', error);
    }
  };

  useEffect(() => {
    loadSales();
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fixed date filtering - handles different date formats
  const filteredSales = dateFilter 
    ? sales.filter(sale => {
        if (!sale.created_at) return false;
        
        try {
          // Handle both ISO format and database timestamp format
          const saleDate = new Date(sale.created_at);
          const filterDate = new Date(dateFilter + 'T00:00:00'); // Add time to ensure same day
          
          // Compare year, month, and day only
          return saleDate.toISOString().split('T')[0] === filterDate.toISOString().split('T')[0];
        } catch (error) {
          console.error('Date parsing error:', error);
          return false;
        }
      })
    : sales;

  // Get unique dates from sales for calendar
  //eslint-disable-next-line react-hooks/exhaustive-deps
  // const getSalesDates = () => {
  //   const dates = new Set();
  //   sales.forEach(sale => {
  //     if (sale.created_at) {
  //       const date = new Date(sale.created_at).toISOString().split('T')[0];
  //       dates.add(date);
  //     }
  //   });
  //   return Array.from(dates) as string[];
  // };

  // Enhanced calendar functions
  const getCalendarDays = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay())); // End on Saturday
    
    const current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const getSalesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return sales.filter(sale => {
      if (!sale.created_at) return false;
      const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
      return saleDate === dateStr;
    });
  };

  const handleDateSelect = (date: Date) => {
    setDateFilter(date.toISOString().split('T')[0]);
    setShowCalendar(false);
  };

  const clearFilters = () => {
    setDateFilter('');
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return 'bg-green-100 text-green-800 border border-green-200';
      case 'card': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'transfer': return 'bg-purple-100 text-purple-800 border border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getProfitColor = (profit: number) => {
    return profit >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getSaleIntensity = (date: Date) => {
    const salesCount = getSalesForDate(date).length;
    if (salesCount === 0) return 'bg-white hover:bg-gray-50';
    if (salesCount <= 2) return 'bg-green-100 hover:bg-green-200';
    if (salesCount <= 5) return 'bg-green-300 hover:bg-green-400';
    return 'bg-green-500 text-white hover:bg-green-600';
  };
  //eslint-disable-next-line react-hooks/exhaustive-deps
  const calendarDays = getCalendarDays();
  const today = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Sales History</h2>
          <p className="text-gray-600 mt-1">View and manage all sales transactions</p>
        </div>
        
        {/* Enhanced Filter Section */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Date
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                id="date-filter"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 border border-blue-700 transition-colors"
              >
                📅 Calendar
              </button>
            </div>

            {/* Enhanced Calendar Dropdown */}
            {showCalendar && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-xl z-50 p-4 w-80">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-800">
                    {format(today, 'MMMM yyyy')}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={clearFilters}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setShowCalendar(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((date) => {
                    const salesCount = getSalesForDate(date).length;
                    const isSelected = dateFilter === date.toISOString().split('T')[0];
                    const isToday = date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
                    const isCurrentMonth = date.getMonth() === today.getMonth();
                    
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => handleDateSelect(date)}
                        disabled={!isCurrentMonth}
                        className={`
                          h-8 rounded-lg text-sm font-medium transition-all
                          ${getSaleIntensity(date)}
                          ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                          ${isToday ? 'border-2 border-blue-400' : ''}
                          ${!isCurrentMonth ? 'text-gray-300 bg-gray-50' : ''}
                          ${salesCount > 0 ? 'hover:shadow-md' : ''}
                        `}
                        title={salesCount > 0 ? 
                          `${salesCount} sale${salesCount > 1 ? 's' : ''} on ${format(date, 'MMM dd')}` : 
                          `No sales on ${format(date, 'MMM dd')}`
                        }
                      >
                        {format(date, 'd')}
                        {salesCount > 0 && (
                          <div className={`w-1 h-1 mx-auto mt-1 rounded-full ${
                            salesCount <= 2 ? 'bg-green-400' : 
                            salesCount <= 5 ? 'bg-green-600' : 'bg-green-800'
                          }`} />
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {/* Sales Legend */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-xs text-gray-600">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-100 rounded mr-1"></div>
                      <span>1-2 sales</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-300 rounded mr-1"></div>
                      <span>3-5 sales</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
                      <span>5+ sales</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {(dateFilter) && (
            <div className="flex items-center space-x-2 mt-6">
              <span className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded">
                Showing: {format(new Date(dateFilter), 'MMM dd, yyyy')}
              </span>
              <button
                onClick={clearFilters}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sales Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">💰</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-semibold text-gray-900">{filteredSales.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">📈</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                ₦{filteredSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">💸</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Profit</p>
              <p className="text-2xl font-semibold text-green-600">
                ₦{filteredSales.reduce((sum, sale) => sum + (sale.total_profit || 0), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">📦</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Items Sold</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredSales.reduce((sum, sale) => 
                  sum + (sale.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0), 0
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredSales.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <p className="text-gray-500 text-lg mb-2">
              {dateFilter ? `No sales on ${format(new Date(dateFilter), 'MMM dd, yyyy')}` : 'No sales recorded yet'}
            </p>
            <button
              onClick={loadSales}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Refresh Data
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sale ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900 font-medium">
                        #{sale.id?.slice(-8)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {sale.created_at ? format(new Date(sale.created_at), 'MMM dd, yyyy') : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {sale.created_at ? format(new Date(sale.created_at), 'hh:mm a') : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <span className="font-semibold">
                          {sale.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
                        </span> items
                      </div>
                      <div className="text-xs text-gray-500 max-w-xs truncate">
                        {sale.items?.slice(0, 2).map(item => {
                          const productName = item.product_name || 
                                            item.product?.name || 
                                            `Product #${item.product_id?.slice(-6) || 'N/A'}`;
                          return productName;
                        }).join(', ')}
                        {sale.items && sale.items.length > 2 && ` +${sale.items.length - 2} more`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full capitalize ${getPaymentMethodColor(sale.payment_method || 'unknown')}`}>
                        {sale.payment_method || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        ₦{(sale.total_amount || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${getProfitColor(sale.total_profit || 0)}`}>
                        ₦{(sale.total_profit || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="text-blue-600 hover:text-blue-900 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors border border-blue-200"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enhanced Sale Details Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Sale Receipt #{selectedSale.id?.slice(-8) || 'N/A'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedSale.created_at ? format(new Date(selectedSale.created_at), 'PPPP p') : 'Date not available'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl bg-white rounded-full p-2 hover:bg-gray-100 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Sale Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-semibold text-lg capitalize text-gray-900 mt-1">
                    {selectedSale.payment_method || 'N/A'}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full mt-1 ${
                    selectedSale.status === 'completed' 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  }`}>
                    {selectedSale.status || 'unknown'}
                  </span>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="font-semibold text-2xl text-gray-900 mt-1">
                    {selectedSale.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Products</p>
                  <p className="font-semibold text-2xl text-gray-900 mt-1">
                    {selectedSale.items?.length || 0}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <h4 className="font-bold text-gray-900 mb-4 text-lg border-b pb-2">Items Sold</h4>
              {!selectedSale.items || selectedSale.items.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <div className="text-gray-400 text-4xl mb-2">📦</div>
                  <p className="text-gray-500">No items found for this sale</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product Details
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Price
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Profit
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedSale.items.map((item, index) => (
                        <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-sm">
                                  {item.product?.name?.charAt(0) || 'P'}
                                </span>
                              </div>
                              <div>
                              <div className="font-medium text-gray-900 text-sm">
                                {item.product_name || item.product?.name || `Product #${item.product_id?.slice(-6) || 'N/A'}`}
                              </div>
                                {item.product_id && (
                                  <div className="text-xs text-gray-400 font-mono mt-1">
                                    SKU: {item.product_id.slice(-8)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          {/* <td className="px-6 py-4 text-sm text-gray-600">
                            {item.product?.category || 'Uncategorized'}
                          </td> */}
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                              {item.quantity || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div className="font-medium">₦{(item.unit_sell_price || 0).toFixed(2)}</div>
                            <div className="text-xs text-gray-400">
                              Cost: ₦{(item.unit_buy_price || 0).toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            ₦{(item.total_sell_price || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className={`font-bold text-center px-2 py-1 rounded ${
                              (item.item_profit || 0) >= 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              ₦{(item.item_profit || 0).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500 text-center mt-1">
                              {item.unit_buy_price ? 
                                `${(((item.unit_sell_price - item.unit_buy_price) / item.unit_buy_price) * 100).toFixed(1)}% margin` 
                                : 'N/A'
                              }
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Totals Section */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
                  <h5 className="font-semibold text-gray-800 mb-4">Financial Summary</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold">₦{(selectedSale.total_amount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold border-t pt-3">
                      <span>Total Revenue:</span>
                      <span className="text-blue-600">₦{(selectedSale.total_amount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
                  <h5 className="font-semibold text-gray-800 mb-4">Profit Analysis</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Cost:</span>
                      <span className="font-semibold">
                        ₦{((selectedSale.total_amount || 0) - (selectedSale.total_profit || 0)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold border-t pt-3">
                      <span>Net Profit:</span>
                      <span className={getProfitColor(selectedSale.total_profit || 0)}>
                        ₦{(selectedSale.total_profit || 0).toFixed(2)}
                      </span>
                    </div>
                    {selectedSale.total_amount && selectedSale.total_amount > 0 && (
                      <div className="text-sm text-gray-600 text-center mt-2">
                        Profit Margin: {((selectedSale.total_profit / selectedSale.total_amount) * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex space-x-4">
                <button
                  onClick={() => setSelectedSale(null)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  Close Receipt
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-6 bg-gray-600 text-white py-4 rounded-lg font-bold hover:bg-gray-700 transition-all shadow-lg"
                >
                  🖨️ Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;