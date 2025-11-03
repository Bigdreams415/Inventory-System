import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const { 
    summary, 
    salesTrend, 
    categories, 
    recentSales, 
    lowStockProducts, 
    loading, 
    error, 
    refreshDashboard 
  } = useDashboard();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error: {error}
        <button 
          onClick={refreshDashboard}
          className="ml-4 bg-red-600 text-white px-3 py-1 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Helper function to get payment method color
  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return 'bg-green-100 text-green-800';
      case 'card': return 'bg-blue-100 text-blue-800';
      case 'transfer': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
          <p className="text-gray-600 mt-1">Real-time analytics and business insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </div>
          <button 
            onClick={refreshDashboard}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Performance */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700">Today's Revenue</h3>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {formatCurrency(summary?.todayRevenue || 0)}
          </p>
          <p className={`text-sm mt-1 ${summary?.revenueChange && summary.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {summary?.revenueChange && summary.revenueChange >= 0 ? '↑' : '↓'} 
            {Math.abs(summary?.revenueChange || 0)}% from yesterday
          </p>
        </div>

        {/* Inventory Overview */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700">Total Products</h3>
            <span className="text-2xl">📦</span>
          </div>
          <p className="text-3xl font-bold text-blue-600 mt-2">{summary?.totalProducts || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Across {summary?.totalCategories || 0} categories</p>
        </div>

        {/* Stock Alerts */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700">Low Stock</h3>
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-3xl font-bold text-orange-600 mt-2">{summary?.lowStockCount || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Need restocking</p>
        </div>

        {/* Sales Activity */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700">Today's Orders</h3>
            <span className="text-2xl">📋</span>
          </div>
          <p className="text-3xl font-bold text-purple-600 mt-2">{summary?.todayOrders || 0}</p>
          <p className="text-sm text-gray-500 mt-1">{summary?.todayItemsSold || 0} items sold</p>
        </div>
      </div>

      {/* Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Sales Trend (Last 7 Days)</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center p-4">
            {salesTrend && salesTrend.labels.length > 0 ? (
              <div className="w-full h-full">
                {/* Simple bar chart visualization */}
                <div className="flex items-end justify-between h-48 space-x-2">
                  {salesTrend.revenue.map((revenue, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div 
                        className="bg-blue-500 rounded-t w-full max-w-12 transition-all hover:bg-blue-600"
                        style={{ height: `${(revenue / Math.max(...salesTrend.revenue)) * 80}%` }}
                        title={`${salesTrend.labels[index]}: ${formatCurrency(revenue)}`}
                      ></div>
                      <div className="text-xs text-gray-500 mt-2 text-center">
                        {salesTrend.labels[index]}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center space-x-6 mt-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                    <span className="text-gray-600">Revenue: {formatCurrency(salesTrend.revenue.reduce((a, b) => a + b, 0))}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                    <span className="text-gray-600">Profit: {formatCurrency(salesTrend.profit.reduce((a, b) => a + b, 0))}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No sales data available for the last 7 days</p>
            )}
          </div>
        </div>

        {/* Product Categories */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Product Categories</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center p-4">
            {categories.length > 0 ? (
              <div className="w-full">
                {/* Simple pie chart visualization using flex */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {categories.slice(0, 4).map((category, index) => (
                    <div key={category.name} className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{
                          backgroundColor: [
                            '#3B82F6', '#10B981', '#F59E0B', '#EF4444'
                          ][index % 4]
                        }}
                      ></div>
                      <span className="text-sm text-gray-700 truncate">{category.name}</span>
                      <span className="text-sm text-gray-500">({category.count})</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 text-sm">
                  {categories.map(category => (
                    <div key={category.name} className="flex justify-between items-center">
                      <span className="text-gray-600">{category.name}</span>
                      <span className="font-semibold">{formatCurrency(category.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No category data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section - Quick Overviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Recent Sales</h3>
            <span className="text-sm text-gray-500">{recentSales.length} sales</span>
          </div>
          <div className="space-y-3">
            {recentSales.length > 0 ? (
              recentSales.map(sale => (
                <div key={sale.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">
                      {formatCurrency(sale.total_amount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {sale.items_count} items • {format(new Date(sale.created_at), 'HH:mm')}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${getPaymentMethodColor(sale.payment_method)}`}>
                    {sale.payment_method}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                No recent sales
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Low Stock Alert</h3>
            <span className="text-sm text-gray-500">{lowStockProducts.length} products</span>
          </div>
          <div className="space-y-3">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map(product => (
                <div key={product.id} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-600">{product.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-orange-600">{product.stock} left</div>
                    <div className="text-xs text-gray-500">{formatCurrency(product.sell_price)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">✅</div>
                All products are well stocked
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/inventory'}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>➕</span>
              <span>Add New Product</span>
            </button>
            <button 
              onClick={() => window.location.href = '/pos'}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>🛒</span>
              <span>Start New Sale</span>
            </button>
            <button 
              onClick={() => window.location.href = '/sales'}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>📊</span>
              <span>View Sales Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;