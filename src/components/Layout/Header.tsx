import React, { useState, useEffect } from 'react';

interface Pharmacy {
  id: string;
  name: string;
  location: string;
  address?: string;
  phone_number?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface NewPharmacyForm {
  name: string;
  location: string;
  address: string;
  phone_number: string;
  email: string;
}

interface SyncState {
  lastSync: string | null;
  isSyncing: boolean;
  progress: number;
  error: string | null;
}

const API_BASE_URL = 'http://localhost:3001/api'; // ← CORRECT! Local server
const CLOUD_SYNC_URL = 'http://localhost:3002/api'; // Cloud sync API

const Header: React.FC = () => {
  const [showPharmacyModal, setShowPharmacyModal] = useState(false);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [currentPharmacy, setCurrentPharmacy] = useState<Pharmacy | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPharmacy, setNewPharmacy] = useState<NewPharmacyForm>({
    name: '',
    location: '',
    address: '',
    phone_number: '',
    email: ''
  });
  const [pharmacyCount, setPharmacyCount] = useState({ count: 0, max_limit: 5, remaining: 5 });

  // Sync state
  const [syncState, setSyncState] = useState<SyncState>({
    lastSync: null,
    isSyncing: false,
    progress: 0,
    error: null
  });

  useEffect(() => {
    fetchPharmacies();
    fetchCurrentPharmacy();
    fetchPharmacyCount();
    fetchSyncStatus(); // Initial sync status fetch
  }, []);

  // Poll sync status every 2 seconds when syncing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (syncState.isSyncing) {
      interval = setInterval(() => {
        fetchSyncStatus();
      }, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [syncState.isSyncing]);

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch(`${CLOUD_SYNC_URL}/sync/status`, {
        headers: {
          'x-api-key': '9a3c7e2f5b8d1a4c6e9f2b5d8a1c4e7f0b3d6a9c2e5f8b1d4a7c0e3f6b9d2a5c' // Your API key
        }
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSyncState(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    }
  };

  const handleManualSync = async () => {
    try {
      setSyncState(prev => ({ ...prev, isSyncing: true, error: null, progress: 10 }));
      const response = await fetch(`${CLOUD_SYNC_URL}/sync/manual`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': '9a3c7e2f5b8d1a4c6e9f2b5d8a1c4e7f0b3d6a9c2e5f8b1d4a7c0e3f6b9d2a5c' // Your API key
        },
      });
    
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSyncState(result.data);
        } else {
          setSyncState(prev => ({ ...prev, error: 'Sync failed', isSyncing: false }));
        }
      } else {
        setSyncState(prev => ({ ...prev, error: 'Sync request failed', isSyncing: false }));
      }
    } catch (error) {
      setSyncState(prev => ({ ...prev, error: 'Sync failed', isSyncing: false }));
    }
  };

  const getSyncStatusText = () => {
    if (syncState.isSyncing) return `Syncing to Cloud... ${syncState.progress}%`;
    if (syncState.error) return `Sync Failed: ${syncState.error}`;
    if (syncState.lastSync) return `Last Sync: ${new Date(syncState.lastSync).toLocaleTimeString()}`;
    return 'Ready to Sync';
  };

  const getSyncStatusColor = () => {
    if (syncState.isSyncing) return 'bg-blue-500';
    if (syncState.error) return 'bg-red-500';
    return 'bg-green-500';
  };

  const fetchCurrentPharmacy = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pharmacy/current`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch current pharmacy: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setCurrentPharmacy(result.data);
      } else {
        setError('No current pharmacy set');
      }
    } catch (err) {
      console.error('Error fetching current pharmacy:', err);
      setError('Failed to load current pharmacy');
    }
  };

  const fetchPharmacies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/pharmacy/all`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch pharmacies: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setPharmacies(result.data);
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching pharmacies:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pharmacies');
      setPharmacies([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPharmacyCount = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pharmacies/count`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPharmacyCount(result.data);
        }
      }
    } catch (err) {
      console.error('Error fetching pharmacy count:', err);
    }
  };

  const switchPharmacy = async (pharmacyId: string) => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/pharmacy/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pharmacyId }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to switch pharmacy: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setCurrentPharmacy(result.data);
        setShowPharmacyModal(false);
        // Refresh all data with new pharmacy context
        window.location.reload();
      } else {
        throw new Error(result.error || 'Failed to switch pharmacy');
      }
    } catch (err) {
      console.error('Error switching pharmacy:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to switch pharmacy';
      setError(errorMsg);
      alert(errorMsg);
    }
  };

  const createNewPharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);

      const response = await fetch(`${API_BASE_URL}/pharmacies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPharmacy),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create pharmacy: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setShowCreateModal(false);
        setNewPharmacy({ name: '', location: '', address: '', phone_number: '', email: '' });
        await fetchPharmacies();
        await fetchPharmacyCount();
        alert('Pharmacy created successfully!');
      } else {
        throw new Error(result.error || 'Failed to create pharmacy');
      }
    } catch (err) {
      console.error('Error creating pharmacy:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to create pharmacy';
      setError(errorMsg);
      alert(errorMsg);
    }
  };

  const deletePharmacy = async (pharmacyId: string) => {
    if (!window.confirm('Are you sure you want to delete this pharmacy? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/pharmacies/${pharmacyId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete pharmacy: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        await fetchPharmacies();
        await fetchPharmacyCount();
        // If we deleted the current pharmacy, switch to another one
        if (currentPharmacy?.id === pharmacyId) {
          const otherPharmacy = pharmacies.find(p => p.id !== pharmacyId);
          if (otherPharmacy) {
            await switchPharmacy(otherPharmacy.id);
          }
        }
        alert('Pharmacy deleted successfully!');
      } else {
        throw new Error(result.error || 'Failed to delete pharmacy');
      }
    } catch (err) {
      console.error('Error deleting pharmacy:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete pharmacy';
      setError(errorMsg);
      alert(errorMsg);
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleInputChange = (field: keyof NewPharmacyForm, value: string) => {
    setNewPharmacy(prev => ({ ...prev, [field]: value }));
  };

  const handleCloseAllModals = () => {
    setShowPharmacyModal(false);
    setShowCreateModal(false);
    setShowManageModal(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      {/* Sync Progress Bar - Full width at the top */}
      {syncState.isSyncing && (
        <div className="w-full bg-gray-200 h-2">
          <div 
            className={`h-2 transition-all duration-300 ${getSyncStatusColor()}`}
            style={{ width: `${syncState.progress}%` }}
          />
        </div>
      )}

      {/* Sync Status Bar - Appears during sync */}
      {syncState.isSyncing && (
        <div className={`w-full px-4 py-2 text-white text-sm font-medium ${getSyncStatusColor()} flex justify-between items-center`}>
          <span>{getSyncStatusText()}</span>
          <span className="text-xs opacity-90">Syncing data to cloud...</span>
        </div>
      )}

      {/* Error Status Bar - Appears when sync fails */}
      {syncState.error && !syncState.isSyncing && (
        <div className="w-full px-4 py-2 bg-red-500 text-white text-sm font-medium flex justify-between items-center">
          <span>{getSyncStatusText()}</span>
          <button 
            onClick={handleManualSync}
            className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <img
            src={`file://${(window as any).electronResources.resourcesPath}/assets/solo.png`}
            alt="Solomon Medicals Logo"
            className="h-16 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>    
        
        {/* Pharmacy Button with Sync Status */}
        <div className="flex items-center space-x-3">
          {/* Sync Button - Sleek and minimal */}
          <button
            onClick={handleManualSync}
            disabled={syncState.isSyncing}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm
              ${syncState.isSyncing
                ? 'bg-blue-100 text-blue-700 border border-blue-200 cursor-not-allowed'
                : syncState.error
                ? 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200'
                : 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200'
              }
            `}
            title={getSyncStatusText()}
          >
            <span className={`${syncState.isSyncing ? 'animate-spin' : ''}`}>
              {syncState.isSyncing ? '🔄' : syncState.error ? '❌' : '☁️'}
            </span>
            <span>Sync Data</span>
          </button>

          {/* Pharmacy Button */}
          <button 
            onClick={() => setShowPharmacyModal(true)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors group"
          >
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                {currentPharmacy?.name || 'No Pharmacy Selected'}
              </p>
              <p className="text-xs text-gray-500 group-hover:text-blue-500 transition-colors">
                {currentPharmacy?.location || 'Select Pharmacy'}
              </p>
              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}
            </div>
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors shadow-sm">
              <span className="text-white font-semibold text-sm">
                {currentPharmacy ? getInitials(currentPharmacy.name) : '?'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Pharmacy Switcher Modal */}
      {showPharmacyModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-end pt-16">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleCloseAllModals}
          />
          
          <div className="relative bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-h-[80vh] overflow-hidden z-10 mr-4 transform transition-all">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Select Pharmacy</h3>
                <button 
                  onClick={handleCloseAllModals}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {currentPharmacy && (
                <p className="text-sm text-gray-600 mt-1">
                  Current: <span className="font-medium text-blue-600">{currentPharmacy.name}</span>
                </p>
              )}
              <div className="mt-2 text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">
                {pharmacyCount.count} of {pharmacyCount.max_limit} pharmacies used
              </div>
            </div>

            <div className="flex flex-col h-[calc(80vh-120px)]">
              <div className="p-3 space-y-2 border-b border-gray-100">
                <button 
                  onClick={() => {
                    setShowPharmacyModal(false);
                    setShowManageModal(true);
                  }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 rounded-lg flex items-center justify-between transition-colors border border-gray-200 hover:border-gray-300"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-600">⚙️</span>
                    </div>
                    <span className="font-medium">Manage Profiles</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
                
                <button 
                  onClick={() => {
                    setShowPharmacyModal(false);
                    setShowCreateModal(true);
                  }}
                  disabled={pharmacyCount.remaining <= 0}
                  className={`w-full text-left px-4 py-3 text-sm rounded-lg flex items-center justify-between transition-colors border ${
                    pharmacyCount.remaining <= 0 
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                      : 'hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      pharmacyCount.remaining <= 0 ? 'bg-gray-200' : 'bg-green-100'
                    }`}>
                      <span className={pharmacyCount.remaining <= 0 ? 'text-gray-400' : 'text-green-600'}>
                        ➕
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Create New Profile</span>
                      <p className="text-xs text-gray-500 mt-1">
                        {pharmacyCount.remaining > 0 
                          ? `${pharmacyCount.remaining} slots available` 
                          : 'Limit reached'}
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="p-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 px-2">Available Pharmacies</h4>
                  
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  ) : pharmacies.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-gray-400">🏪</span>
                      </div>
                      <p className="text-sm">No pharmacies available</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pharmacies.map((pharmacy) => (
                        <button
                          key={pharmacy.id}
                          onClick={() => switchPharmacy(pharmacy.id)}
                          className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-all duration-200 ${
                            currentPharmacy?.id === pharmacy.id 
                              ? 'bg-blue-50 border border-blue-200 shadow-sm' 
                              : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                          }`}
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              currentPharmacy?.id === pharmacy.id ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              <span className={`text-sm font-medium ${
                                currentPharmacy?.id === pharmacy.id ? 'text-blue-600' : 'text-gray-600'
                              }`}>
                                {getInitials(pharmacy.name)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium truncate ${
                                currentPharmacy?.id === pharmacy.id ? 'text-blue-700' : 'text-gray-900'
                              }`}>
                                {pharmacy.name}
                              </div>
                              <div className="text-xs text-gray-500 truncate">{pharmacy.location}</div>
                            </div>
                          </div>
                          {currentPharmacy?.id === pharmacy.id && (
                            <div className="flex-shrink-0">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Pharmacy Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleCloseAllModals}
          />
          
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden transform transition-all">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Create New Pharmacy</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {pharmacyCount.remaining} of {pharmacyCount.max_limit} slots available
                  </p>
                </div>
                <button 
                  onClick={handleCloseAllModals}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <form onSubmit={createNewPharmacy} className="p-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pharmacy Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPharmacy.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., A&B Pharmacy - ABJ"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPharmacy.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., Abuja, Nigeria"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      value={newPharmacy.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="Full pharmacy address"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={newPharmacy.phone_number}
                        onChange={(e) => handleInputChange('phone_number', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="+2348012345678"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={newPharmacy.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="pharmacy@example.com"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseAllModals}
                    className="px-6 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pharmacyCount.remaining <= 0}
                    className={`px-6 py-3 text-sm font-medium text-white rounded-lg transition-all ${
                      pharmacyCount.remaining <= 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    }`}
                  >
                    Create Pharmacy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Manage Pharmacies Modal */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleCloseAllModals}
          />
          
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden transform transition-all">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Manage Pharmacies</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {pharmacyCount.count} of {pharmacyCount.max_limit} pharmacies
                  </p>
                </div>
                <button 
                  onClick={handleCloseAllModals}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="p-6">
                {pharmacies.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🏪</span>
                    </div>
                    <p className="text-sm">No pharmacies found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pharmacies.map((pharmacy) => (
                      <div key={pharmacy.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors bg-white shadow-sm">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            currentPharmacy?.id === pharmacy.id ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <span className={`text-sm font-medium ${
                              currentPharmacy?.id === pharmacy.id ? 'text-blue-600' : 'text-gray-600'
                            }`}>
                              {getInitials(pharmacy.name)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{pharmacy.name}</div>
                            <div className="text-sm text-gray-500 truncate">{pharmacy.location}</div>
                            {currentPharmacy?.id === pharmacy.id && (
                              <div className="text-xs text-blue-600 font-medium mt-1">Current</div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              setShowManageModal(false);
                              switchPharmacy(pharmacy.id);
                            }}
                            className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                          >
                            Switch
                          </button>
                          <button
                            onClick={() => deletePharmacy(pharmacy.id)}
                            className="px-3 py-2 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            disabled={pharmacies.length <= 1}
                            title={pharmacies.length <= 1 ? "Cannot delete the only pharmacy" : "Delete pharmacy"}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={handleCloseAllModals}
                  className="px-6 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;