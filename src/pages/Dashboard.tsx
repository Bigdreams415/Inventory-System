import React from 'react';
import { useDashboard } from '../hooks/useDashboard';

import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard: React.FC = () => {
  const { 
    summary, 
    salesTrend, 
    categories,   
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
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  // Chart data for sales trend
  const salesTrendData = {
    labels: salesTrend?.labels || [],
    datasets: [
      {
        label: 'Revenue',
        data: salesTrend?.revenue || [],
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Profit',
        data: salesTrend?.profit || [],
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      }
    ]
  };

  const salesTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value: any) {
            return '₦' + value.toLocaleString('en-NG');
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  // Chart data for categories
  const categoryData = {
    labels: categories.map(cat => cat.name),
    datasets: [
      {
        data: categories.map(cat => cat.revenue),
        backgroundColor: [
          '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
          '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
        ],
        borderWidth: 2,
        borderColor: '#fff',
      }
    ]
  };

  const categoryOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 12,
          padding: 15,
          usePointStyle: true,
        },
      },
    },
    cutout: '60%',
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm transition-colors flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Performance */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Today's Revenue</h3>
            <span className="text-xl">💰</span>
          </div>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {formatCurrency(summary?.todayRevenue || 0)}
          </p>
          <p className={`text-xs mt-1 ${summary?.revenueChange && summary.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {summary?.revenueChange && summary.revenueChange >= 0 ? '↑' : '↓'} 
            {Math.abs(summary?.revenueChange || 0)}% from yesterday
          </p>
        </div>

        {/* Inventory Overview */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Total Products</h3>
            <span className="text-xl">📦</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2">{summary?.totalProducts || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Across {summary?.totalCategories || 0} categories</p>
        </div>

        {/* Stock Alerts */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Low Stock</h3>
            <span className="text-xl">⚠️</span>
          </div>
          <p className="text-2xl font-bold text-orange-600 mt-2">{summary?.lowStockCount || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Need restocking</p>
        </div>

        {/* Sales Activity */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Today's Orders</h3>
            <span className="text-xl">📋</span>
          </div>
          <p className="text-2xl font-bold text-purple-600 mt-2">{summary?.todayOrders || 0}</p>
          <p className="text-xs text-gray-500 mt-1">{summary?.todayItemsSold || 0} items sold</p>
        </div>
      </div>

      {/* Charts & Analytics Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Sales Trend (Last 7 Days)</h3>
          </div>
          <div className="h-80">
            {salesTrend && salesTrend.labels.length > 0 ? (
              <Bar data={salesTrendData} options={salesTrendOptions} />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">📊</div>
                  <p>No sales data available</p>
                  <p className="text-sm">Sales data will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Categories */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Revenue by Category</h3>
          </div>
          <div className="h-80">
            {categories.length > 0 ? (
              <div className="flex flex-col lg:flex-row h-full">
                <div className="lg:w-2/3 h-64 lg:h-full">
                  <Doughnut data={categoryData} options={categoryOptions} />
                </div>
                <div className="lg:w-1/3 lg:pl-4 mt-4 lg:mt-0">
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {categories.map((category, index) => (
                      <div key={category.name} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <div 
                            className="w-3 h-3 rounded flex-shrink-0"
                            style={{
                              backgroundColor: categoryData.datasets[0].backgroundColor[index]
                            }}
                          ></div>
                          <span className="text-sm text-gray-700 truncate">{category.name}</span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-semibold">{formatCurrency(category.revenue)}</div>
                          <div className="text-xs text-gray-500">{category.count} products</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">📦</div>
                  <p>No category data available</p>
                  <p className="text-sm">Product categories will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section - Quick Overviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Stock Worth */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Total Stock Worth</h3>
            <span className="text-sm text-gray-500">Inventory Value</span>
          </div>
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="text-4xl mb-3">💰</div>
              <div className="text-3xl font-bold text-purple-600">
                {formatCurrency(summary?.totalStockWorth || 0)}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Total investment in inventory
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="text-xs text-blue-600 font-medium">Products</div>
                <div className="text-lg font-bold text-blue-700">{summary?.totalProducts || 0}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="text-xs text-green-600 font-medium">Categories</div>
                <div className="text-lg font-bold text-green-700">{summary?.totalCategories || 0}</div>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="text-xs text-gray-600">Calculated using</div>
              <div className="text-sm font-medium text-gray-700">Buy Price × Stock Quantity</div>
            </div>
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Low Stock Alert</h3>
            <span className="text-sm text-gray-500">{lowStockProducts.length} products</span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map(product => (
                <div key={product.id} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 truncate">{product.name}</div>
                    <div className="text-sm text-gray-600 truncate">{product.category}</div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
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