import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const Admin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Add this useEffect to re-check auth whenever component mounts
  useEffect(() => {
    console.log('🔄 Admin component mounted, checking auth...');
    checkAuthStatus();
  }, []); // Empty dependency array = run on every mount

  const checkAuthStatus = async () => {
    try {
      console.log('🔐 Checking authentication status...');
      
      if (apiService.isAuthenticated()) {
        console.log('📝 Token found, verifying...');
        const result = await apiService.verifyToken();
        console.log('🔑 Verification result:', result);
        
        if (result.valid) {
          console.log('✅ Token is valid');
          setIsAuthenticated(true);
        } else {
          console.log('❌ Token is invalid');
          await apiService.logout();
          setIsAuthenticated(false);
        }
      } else {
        console.log('🚫 No token found');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('🚨 Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    try {
      console.log('🔐 Attempting login...');
      const result = await apiService.login(username, password);
      if (result.token) {
        console.log('✅ Login successful');
        setIsAuthenticated(true);
        setError('');
      }
    } catch (err) {
      console.error('❌ Login failed:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out...');
      await apiService.logout();
      setIsAuthenticated(false);
      setUsername('');
      setPassword('');
      setError('');
      console.log('✅ Logout successful');
    } catch (err) {
      console.error('❌ Logout failed:', err);
      setIsAuthenticated(false);
      setUsername('');
      setPassword('');
    }
  };

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Checking Authentication</h2>
          <p className="text-gray-600">Verifying your session...</p>
        </div>
      </div>
    );
  }

  // Success state after login
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 p-8 text-center">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-white">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Authentication Successful</h1>
            <p className="text-blue-100">Welcome to Admin Portal</p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-green-600">🔒</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Administrative Access Granted
              </h2>
              <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">
                You now have full access to all protected administrative features. 
                You can manage inventory, view sales reports, and configure system settings.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center mb-3">
                  <span className="text-blue-600 text-xl mr-3">💰</span>
                  <h3 className="font-semibold text-blue-800">Financial Analytics</h3>
                </div>
                <p className="text-blue-700 text-sm">
                  Access profit margins, revenue reports, and financial insights
                </p>
              </div>

              <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                <div className="flex items-center mb-3">
                  <span className="text-purple-600 text-xl mr-3">📦</span>
                  <h3 className="font-semibold text-purple-800">Inventory Control</h3>
                </div>
                <p className="text-purple-700 text-sm">
                  Configure products, pricing, and stock levels
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <div className="flex items-center mb-3">
                  <span className="text-green-600 text-xl mr-3">📊</span>
                  <h3 className="font-semibold text-green-800">Advanced Reports</h3>
                </div>
                <p className="text-green-700 text-sm">
                  Generate detailed business intelligence reports
                </p>
              </div>

              <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                <div className="flex items-center mb-3">
                  <span className="text-orange-600 text-xl mr-3">⚙️</span>
                  <h3 className="font-semibold text-orange-800">System Config</h3>
                </div>
                <p className="text-orange-700 text-sm">
                  Manage users, permissions, and system settings
                </p>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <span>📊</span>
                <span>Go to Dashboard</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 border border-gray-300"
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login form
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 p-8 text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Administrative Access</h1>
          <p className="text-blue-100">Secure system authentication required</p>
        </div>

        {/* Login Form */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-red-500 mr-3">⚠️</span>
                <div>
                  <p className="text-red-700 font-medium text-sm">Authentication Error</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter administrative username"
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>🔑</span>
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <span className="text-blue-500 mt-0.5">🛡️</span>
              <div>
                <p className="text-sm font-medium text-blue-800">Security Notice</p>
                <p className="text-sm text-blue-600 mt-1">
                  This portal provides access to sensitive administrative functions. 
                  Please ensure you are authorized to access this system.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              POS Inventory System
            </p>
            <div className="flex items-center space-x-2 text-gray-400">
              <span className="text-xs">🔒</span>
              <span className="text-xs">Secure</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;