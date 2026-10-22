// pages/AdminPage.jsx
import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import AdminSidebar from './admin/AdminSidebar.jsx';
import AdminTopbar from './admin/AdminTopbar.jsx';
import AdminDashboard from './admin/AdminDashboard.jsx';
import AdminProducts from './admin/AdminProducts.jsx';
import AdminOrders from './admin/AdminOrders.jsx';
import AdminCategories from './admin/AdminCategories.jsx';
import AdminWilayas from './admin/AdminWilayas.jsx';
import AdminSettings from './admin/AdminSettings.jsx';
import AdminLogin from './admin/AdminLogin.jsx';

export default function AdminPage() {
  const { dbReady } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem('admin_auth') === '1'
  );

  if (!authenticated) {
    return <AdminLogin onSuccess={() => setAuthenticated(true)} />;
  }

  const renderSection = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard onNavigate={setActiveTab} key={dbReady ? 'dash-1' : 'dash-0'} />;
      case 'products':
        return <AdminProducts key={dbReady ? 'prod-1' : 'prod-0'} />;
      case 'orders':
        return <AdminOrders key={dbReady ? 'ord-1' : 'ord-0'} />;
      case 'categories':
        return <AdminCategories key={dbReady ? 'cat-1' : 'cat-0'} />;
      case 'wilayas':
        return <AdminWilayas key={dbReady ? 'wil-1' : 'wil-0'} />;
      case 'settings':
        return <AdminSettings key={dbReady ? 'set-1' : 'set-0'} />;
      default:
        return <AdminDashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar
        active={activeTab}
        setActive={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="admin-main-wrapper">
        <AdminTopbar
          active={activeTab}
          setMobileOpen={setMobileOpen}
        />
        <main className="admin-content">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
