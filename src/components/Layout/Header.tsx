import React, { useState } from 'react';

const Header: React.FC = () => {
  const [showPharmacyModal, setShowPharmacyModal] = useState(false);
  const [currentPharmacy, setCurrentPharmacy] = useState({
    id: 1,
    name: 'Solomon Medicals & Stores',
    location: 'Main Branch',
    tenantId: '12345'
  });

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-800">POS Inventory System</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Pharmacy Switcher Button */}
          <button 
            onClick={() => setShowPharmacyModal(true)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
          >
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">{currentPharmacy.name}</p>
              <p className="text-xs text-gray-500">Tenant ID: {currentPharmacy.tenantId}</p>
            </div>
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">SM</span>
            </div>
          </button>
        </div>
      </div>

      {/* Pharmacy Modal - We'll build this next */}
      {showPharmacyModal && (
        <div className="absolute right-4 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-700">Current: {currentPharmacy.name}</p>
          </div>
          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
            Manage Profile
          </button>
          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
            Create New Profile
          </button>
          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
            Switch to A&B Pharmacy - ABJ
          </button>
          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
            Switch to A&B Pharmacy - Edo
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;