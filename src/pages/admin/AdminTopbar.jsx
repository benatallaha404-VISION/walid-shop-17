// src/pages/admin/AdminTopbar.jsx
import React from 'react';
import { Menu, Store, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminTopbar({ active, setMobileOpen }) {
  const titles = {
    dashboard: 'Tableau de bord / لوحة التحكم',
    products: 'Gestion des Produits / إدارة المنتجات',
    orders: 'Gestion des Commandes / إدارة الطلبات',
    categories: 'Gestion des Catégories / إدارة الأقسام',
    wilayas: 'Wilayas & Livraison / الولايات والتوصيل',
    settings: 'Paramètres du Magasin / الإعدادات',
  };

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        <button
          className="admin-menu-toggle"
          onClick={() => setMobileOpen(prev => !prev)}
          aria-label="Ouvrir le menu"
          id="admin-menu-toggle-btn"
        >
          <Menu size={22} />
        </button>
        <h2 className="admin-topbar-title">{titles[active] || 'Administration'}</h2>
      </div>

      <div className="admin-topbar-right">
        <Link to="/" className="btn btn-outline btn-sm admin-topbar-link" target="_blank" rel="noreferrer">
          <Store size={14} />
          <span>Visiter le magasin</span>
          <ExternalLink size={12} style={{ opacity: 0.6 }} />
        </Link>
      </div>
    </header>
  );
}
