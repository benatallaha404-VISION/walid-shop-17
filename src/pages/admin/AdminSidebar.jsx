// src/pages/admin/AdminSidebar.jsx
import React from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, Settings, Tag,
  MapPin, Store, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/logo.png';

export default function AdminSidebar({ active, setActive, mobileOpen, setMobileOpen }) {
  const navItems = [
    { key: 'dashboard', label: 'Tableau de bord', labelAr: 'لوحة التحكم', icon: <LayoutDashboard size={18} /> },
    { key: 'products', label: 'Produits', labelAr: 'المنتجات', icon: <Package size={18} /> },
    { key: 'orders', label: 'Commandes', labelAr: 'الطلبات', icon: <ShoppingCart size={18} /> },
    { key: 'categories', label: 'Catégories', labelAr: 'الأقسام', icon: <Tag size={18} /> },
    { key: 'wilayas', label: 'Wilayas & Livraison', labelAr: 'الولايات والتوصيل', icon: <MapPin size={18} /> },
    { key: 'settings', label: 'Paramètres', labelAr: 'الإعدادات', icon: <Settings size={18} /> },
  ];

  const handleSelect = (key) => {
    setActive(key);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`admin-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4,
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
            }}>
              <img
                src={logoImg}
                alt="Logo"
                style={{
                  width: '100%',
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            </div>
            <div>
              <span style={{ color: 'var(--gold)' }}>WALID</span> SHOP
            </div>
            <span className="admin-badge">ADMIN</span>
          </div>
          {setMobileOpen && (
            <button
              className="admin-sidebar-close"
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <nav className="admin-sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.key}
              className={`admin-nav-item ${active === item.key ? 'active' : ''}`}
              onClick={() => handleSelect(item.key)}
              id={`admin-nav-${item.key}`}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span className="admin-nav-label">
                <span>{item.label}</span>
                <span className="admin-nav-label-ar">{item.labelAr}</span>
              </span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-view-store-btn" id="admin-view-store-btn">
            <Store size={16} />
            <span>Voir le site</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
