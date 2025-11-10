import React, { useState, useEffect } from 'react';
import { useServices } from '../hooks/useService';
import { Service, ServiceSale } from '../types';

const Services: React.FC = () => {
  const {
    services,
    serviceSales,
    serviceStats,
    salesStats,
    loading,
    error,
    createService,
    updateService,
    deleteService,
    toggleServiceStatus,
    recordServiceSale,
    refreshAll
  } = useServices();
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [activeTab, setActiveTab] = useState<'services' | 'sales'>('services');
  
  const [serviceForm, setServiceForm] = useState({
    name: '',
    category: 'consultation',
    description: '',
    price: 0,
    duration: 30
  });

  const [saleForm, setSaleForm] = useState({
    service_id: '',
    quantity: 1,
    unit_price: 0,
    served_by: '',
    notes: ''
  });

  const serviceCategories = [
    'consultation',
    'medical_test', 
    'treatment',
    'screening',
    'prescription',
    'home_care',
    'equipment_rental'
  ];

  const categoryLabels: { [key: string]: string } = {
    consultation: 'Medical Consultation',
    medical_test: 'Medical Test',
    treatment: 'Treatment Procedure',
    screening: 'Health Screening',
    prescription: 'Prescription Service',
    home_care: 'Home Care',
    equipment_rental: 'Equipment Rental'
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
   
    const success = editingService
      ? await updateService(editingService.id, serviceForm)
      : await createService(serviceForm);
    if (success) {
      setShowServiceModal(false);
      setEditingService(null);
      setServiceForm({ name: '', category: 'consultation', description: '', price: 0, duration: 30 });
    }
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
   
    const success = await recordServiceSale(saleForm);
   
    if (success) {
      setShowSaleModal(false);
      setSaleForm({ service_id: '', quantity: 1, unit_price: 0, served_by: '', notes: '' });
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      await deleteService(serviceId);
    }
  };

  const handleToggleServiceStatus = async (serviceId: string) => {
    await toggleServiceStatus(serviceId);
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      consultation: 'bg-blue-100 text-blue-800',
      medical_test: 'bg-green-100 text-green-800',
      treatment: 'bg-purple-100 text-purple-800',
      screening: 'bg-orange-100 text-orange-800',
      prescription: 'bg-indigo-100 text-indigo-800',
      home_care: 'bg-pink-100 text-pink-800',
      equipment_rental: 'bg-teal-100 text-teal-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // Calculate today's revenue from service sales
  const calculateTodayServiceRevenue = () => {
    const today = new Date().toDateString();
    return serviceSales
      .filter(sale => new Date(sale.created_at).toDateString() === today)
      .reduce((total, sale) => total + sale.total_amount, 0);
  };

  // Calculate total revenue from service sales
  const calculateTotalServiceRevenue = () => {
    return serviceSales.reduce((total, sale) => total + sale.total_amount, 0);
  };

  // THE REST OF YOUR COMPONENT REMAINS EXACTLY THE SAME!
  // Only the data source and handler functions have changed
  // Keep all your existing JSX exactly as it is...
  return (
    <div className="space-y-6 p-4">
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
          <button
            onClick={refreshAll}
            className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm"
          >
            Retry
          </button>
        </div>
      )}
      {/* Loading State */}
      {loading && services.length === 0 && (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading services data...</div>
        </div>
      )}
      {/* Header - Keep exactly the same */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Medical Services</h1>
          <p className="text-gray-600 mt-1">Manage medical services and track service revenue</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowSaleModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <span>💰</span>
            <span>Record Service Sale</span>
          </button>
          <button
            onClick={() => setShowServiceModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <span>➕</span>
            <span>Add New Service</span>
          </button>
        </div>
      </div>

      {/* Revenue Summary - Keep exactly the same */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Total Services</h3>
            <span className="text-xl">🏥</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {serviceStats?.total_services || services.length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Available medical services</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Today's Revenue</h3>
            <span className="text-xl">💰</span>
          </div>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {formatCurrency(salesStats?.today_revenue || calculateTodayServiceRevenue())}
          </p>
          <p className="text-xs text-gray-500 mt-1">From service sales</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Total Revenue</h3>
            <span className="text-xl">📊</span>
          </div>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {formatCurrency(salesStats?.total_revenue || calculateTotalServiceRevenue())}
          </p>
          <p className="text-xs text-gray-500 mt-1">All-time service revenue</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('services')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'services'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Services List
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'sales'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Service Sales
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Medical Services</h2>
                <p className="text-sm text-gray-600">
                  {services.filter(s => s.is_active).length} active services
                </p>
              </div>

              {services.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🏥</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Services Yet</h3>
                  <p className="text-gray-500 mb-4">Get started by adding your first medical service</p>
                  <button
                    onClick={() => setShowServiceModal(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Add First Service
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map(service => (
                    <div key={service.id} className={`bg-white rounded-lg border-2 transition-all ${
                      service.is_active ? 'border-gray-200 hover:border-blue-300' : 'border-gray-100 opacity-60'
                    }`}>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-gray-800 text-lg">{service.name}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(service.category)}`}>
                            {categoryLabels[service.category]}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>
                        
                        <div className="flex justify-between items-center text-sm mb-4">
                          <div>
                            <span className="font-semibold text-green-600">{formatCurrency(service.price)}</span>
                            <span className="text-gray-500 ml-2">• {service.duration} mins</span>
                          </div>
                          <div className={`px-2 py-1 text-xs rounded-full ${
                            service.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {service.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </div>

                        <div className="flex justify-between space-x-2">
                          <button
                            onClick={() => handleToggleServiceStatus(service.id)}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                              service.is_active
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {service.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingService(service);
                              setServiceForm({
                                name: service.name,
                                category: service.category,
                                description: service.description || '',
                                price: service.price,
                                duration: service.duration
                              });
                              setShowServiceModal(true);
                            }}
                            className="flex-1 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="flex-1 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sales Tab */}
          {activeTab === 'sales' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Service Sales History</h2>
                <p className="text-sm text-gray-600">
                  {serviceSales.length} total sales
                </p>
              </div>

              {serviceSales.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">💰</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Service Sales Yet</h3>
                  <p className="text-gray-500 mb-4">Start recording your service sales</p>
                  <button
                    onClick={() => setShowSaleModal(true)}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Record First Sale
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Service
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Served By
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {serviceSales.map(sale => (
                          <tr key={sale.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {sale.service?.name}
                                </div>
                                <div className="text-xs text-gray-500 capitalize">
                                  {sale.service && categoryLabels[sale.service.category]}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {sale.served_by}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(sale.created_at).toLocaleDateString()} at{' '}
                              {new Date(sale.created_at).toLocaleTimeString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {sale.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                              {formatCurrency(sale.total_amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingService ? 'Edit Service' : 'Add New Service'}
            </h3>
            
            <form onSubmit={handleServiceSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Name *</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Doctor Consultation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({...serviceForm, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {serviceCategories.map(cat => (
                      <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe the service..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={serviceForm.price}
                      onChange={(e) => setServiceForm({...serviceForm, price: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={serviceForm.duration}
                      onChange={(e) => setServiceForm({...serviceForm, duration: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowServiceModal(false);
                    setEditingService(null);
                    setServiceForm({ name: '', category: 'consultation', description: '', price: 0, duration: 30 });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  {editingService ? 'Update Service' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Service Sale Modal */}
      {showSaleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Record Service Sale</h3>
            
            <form onSubmit={handleSaleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service *</label>
                  <select
                    required
                    value={saleForm.service_id}
                    onChange={(e) => {
                      const service = services.find(s => s.id === e.target.value);
                      setSaleForm({
                        ...saleForm,
                        service_id: e.target.value,
                        unit_price: service?.price || 0
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a service</option>
                    {services.filter(s => s.is_active).map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name} - {formatCurrency(service.price)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={saleForm.quantity}
                      onChange={(e) => setSaleForm({...saleForm, quantity: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₦) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={saleForm.unit_price}
                      onChange={(e) => setSaleForm({...saleForm, unit_price: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Served By *</label>
                  <input
                    type="text"
                    required
                    value={saleForm.served_by}
                    onChange={(e) => setSaleForm({...saleForm, served_by: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Dr. Ade, Nurse Joy"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea
                    value={saleForm.notes}
                    onChange={(e) => setSaleForm({...saleForm, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Any additional notes about the service..."
                  />
                </div>

                {saleForm.service_id && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Total Amount:</span>
                      <span className="text-lg font-semibold text-green-600">
                        {formatCurrency(saleForm.unit_price * saleForm.quantity)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowSaleModal(false);
                    setSaleForm({ service_id: '', quantity: 1, unit_price: 0, served_by: '', notes: '' });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!saleForm.service_id}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Record Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;