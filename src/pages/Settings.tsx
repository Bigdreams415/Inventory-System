import React, { useState } from 'react';

const Settings: React.FC = () => {
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    const handleSave = async () => {
        setSaving(true);
        setSaveMessage('');
        
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSaveMessage('Settings saved successfully!');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (error) {
            setSaveMessage('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
                <p className="text-gray-600 mt-2">Manage your pharmacy system configuration</p>
            </div>

            {saveMessage && (
                <div className={`mb-6 p-4 rounded-lg ${
                    saveMessage.includes('Error') 
                        ? 'bg-red-100 border border-red-400 text-red-700'
                        : 'bg-green-100 border border-green-400 text-green-700'
                }`}>
                    {saveMessage}
                </div>
            )}

            {/* Single Tab - Backup & Data */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                <nav className="flex">
                    <button className="flex items-center space-x-2 px-6 py-4 font-medium text-blue-700 border-b-2 border-blue-700 bg-blue-50 whitespace-nowrap rounded-t-lg">
                        <span className="text-lg">💾</span>
                        <span>Backup & Data</span>
                    </button>
                </nav>
            </div>

            {/* Backup & Data Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Backup & Data Management</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mb-8">
                        <div className="bg-white border-2 border-gray-200 rounded-lg p-8 text-center hover:border-green-300 transition-colors">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">📤</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Export Data</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Export your sales, inventory, and customer data
                            </p>
                            <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                                Export Now
                            </button>
                        </div>

                        <div className="bg-white border-2 border-gray-200 rounded-lg p-8 text-center hover:border-blue-300 transition-colors">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">📥</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Import Data</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Import products, customers, or sales data
                            </p>
                            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                Import Data
                            </button>
                        </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl">
                        <h4 className="font-semibold text-red-800 mb-2">⚠️ Danger Zone</h4>
                        <p className="text-sm text-red-700 mb-4">
                            Permanent actions that cannot be undone. Please proceed with caution.
                        </p>
                        <button className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors">
                            Clear All Data
                        </button>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-8 mt-8 border-t border-gray-200">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 text-white px-10 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>Saving...</span>
                            </>
                        ) : (
                            <span>Save Settings</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;