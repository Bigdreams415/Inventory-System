import React, { useState } from 'react';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import PointOfSale from './pages/PointOfSale';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Services from './pages/Services';
import { PageType } from './types/navigation';
import AdminPage from './pages/Admin';
import Settings from './pages/Settings';
import UpdateChecker from './components/UpdateChecker'; // ← ADD THIS IMPORT

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('pos');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'pos':
        return <PointOfSale />;
      case 'inventory':
        return <Inventory />;
      case 'sales':
        return <Sales />;
      case 'services':
        return <Services />;
      case 'admin':
        return <AdminPage />;
      case 'settings':
        return <Settings />;
      default:
        return <PointOfSale />;
    }
  };

  return (
    <>
      <UpdateChecker /> 
      <Layout activePage={currentPage} setActivePage={setCurrentPage}>
        {renderPage()}
      </Layout>
    </>
  );
}

export default App;