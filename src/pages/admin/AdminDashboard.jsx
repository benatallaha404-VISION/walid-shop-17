// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { ShoppingCart, DollarSign, Clock, Package, XCircle, ArrowRight } from 'lucide-react';
import { getStats, getOrders } from '../../db.js';

export default function AdminDashboard({ onNavigate }) {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalAllOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    totalProducts: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);

  const loadDashboard = () => {
    try {
      setStats(getStats());
      setRecentOrders(getOrders().slice(0, 7));
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    }
  };

  useEffect(() => {
    loadDashboard();
    const handleStoreChange = () => loadDashboard();
    window.addEventListener('walid_shop_store_change', handleStoreChange);
    return () => window.removeEventListener('walid_shop_store_change', handleStoreChange);
  }, []);

  const statCards = [
    {
      label: 'Commandes Valides (الطلبات النشطة)',
      value: stats.totalOrders,
      subtext: stats.cancelledOrders > 0 ? `(${stats.cancelledOrders} طلبات ملغاة مستثناة)` : 'بدون الطلبات الملغاة',
      icon: <ShoppingCart size={20} />,
      color: '#1d4ed8'
    },
    {
      label: 'Chiffre d\'Affaires (المداخيل الفعلية)',
      value: `${stats.totalRevenue?.toLocaleString()} DZD`,
      subtext: 'مخصوم منها أي طلبية ملغاة',
      icon: <DollarSign size={20} />,
      color: '#059669'
    },
    {
      label: 'En Attente (طلبات قيد المعالجة)',
      value: stats.pendingOrders,
      subtext: 'تنتظر التأكيد أو الإرسال',
      icon: <Clock size={20} />,
      color: '#d97706'
    },
    {
      label: 'Commandes Annulées (طلبات ملغاة)',
      value: stats.cancelledOrders,
      subtext: 'تم إرجاع سلعها للمخزون',
      icon: <XCircle size={20} />,
      color: '#dc2626'
    },
    {
      label: 'Produits en Ligne (المنتجات النشطة)',
      value: stats.totalProducts,
      subtext: 'منتجات متوفرة للبيع',
      icon: <Package size={20} />,
      color: '#7c3aed'
    },
  ];

  const statusLabel = (s) => {
    const map = { pending: 'En attente', confirmed: 'Confirmé', shipped: 'Expédié', delivered: 'Livré', cancelled: 'Annulé' };
    return map[s] || s;
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 className="admin-page-title" style={{ margin: 0 }}>Tableau de bord (لوحة التحكم والإحصائيات)</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--gray)' }}>
          حسابات ومداخيل دقيقة تلقائية: عند إلغاء أي طلبية يُلغى مدخولها فوراً وتُعاد المنتجات إلى المخزون.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{
        marginBottom: 28,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16
      }}>
        {statCards.map((st, i) => (
          <div key={i} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              background: `${st.color}18`,
              color: st.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {st.icon}
            </div>
            <div>
              <div className="stat-label" style={{ fontSize: 12, color: 'var(--gray)' }}>{st.label}</div>
              <div className="stat-value" style={{ fontSize: 20, fontWeight: 900, marginTop: 2 }}>{st.value}</div>
              {st.subtext && (
                <div style={{ fontSize: 11, color: 'var(--gray-light)', marginTop: 2 }}>{st.subtext}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders Card */}
      <div className="admin-card">
        <div className="admin-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3>Dernières Commandes (أحدث الطلبيات)</h3>
          {onNavigate && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onNavigate('orders')}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <span>Voir toutes les commandes</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>N° Commande</th>
                <th>Client</th>
                <th>Wilaya & Type</th>
                <th>Articles & Choix (المقاس / اللون)</th>
                <th>Total</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-light)', padding: 36 }}>
                    Aucune commande pour le moment
                  </td>
                </tr>
              ) : recentOrders.map(o => (
                <tr key={o.id}>
                  <td><strong>{o.order_number}</strong></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{o.customer_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-light)' }}>{o.customer_phone}</div>
                  </td>
                  <td>
                    <div>{o.wilaya}</div>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      marginTop: 2,
                      padding: '1px 5px',
                      borderRadius: 4,
                      background: o.delivery_type === 'office' ? '#eff6ff' : '#f0fdf4',
                      color: o.delivery_type === 'office' ? '#1e40af' : '#166534'
                    }}>
                      {o.delivery_type === 'office' ? '🏢 مكتب' : '🏠 منزل'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {o.items?.slice(0, 2).map((it, idx) => (
                        <div key={idx} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>{it.name} ×{it.qty}</span>
                          {it.size && (
                            <span style={{ background: 'var(--black)', color: 'var(--gold)', padding: '1px 4px', borderRadius: 2, fontSize: 10, fontWeight: 700 }}>
                              {it.size}
                            </span>
                          )}
                          {it.color && (
                            <span style={{ width: 9, height: 9, borderRadius: '50%', background: it.color, border: '1px solid rgba(0,0,0,0.2)' }} />
                          )}
                        </div>
                      ))}
                      {(o.items?.length || 0) > 2 && (
                        <span style={{ fontSize: 11, color: 'var(--gray)' }}>+{(o.items?.length || 0) - 2} autre(s)</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontWeight: 700,
                      textDecoration: o.status === 'cancelled' ? 'line-through' : 'none',
                      color: o.status === 'cancelled' ? 'var(--gray-light)' : 'inherit'
                    }}>
                      {o.total?.toLocaleString()} DZD
                    </span>
                    {o.status === 'cancelled' && (
                      <span style={{ display: 'block', fontSize: 10, color: '#dc2626', fontWeight: 800 }}>
                        غير محسوب
                      </span>
                    )}
                  </td>
                  <td><span className={`status-badge ${o.status}`}>{statusLabel(o.status)}</span></td>
                  <td style={{ color: 'var(--gray-light)', fontSize: 12 }}>
                    {new Date(o.created_at).toLocaleDateString('fr-DZ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
