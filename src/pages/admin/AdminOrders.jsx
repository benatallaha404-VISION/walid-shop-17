// src/pages/admin/AdminOrders.jsx
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Trash2, ShoppingCart, Search, Filter, Phone, MapPin } from 'lucide-react';
import { getOrders, updateOrderStatus, deleteOrder } from '../../db.js';
import { useApp } from '../../context/AppContext.jsx';

export default function AdminOrders() {
  const { addToast } = useApp();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  const loadOrders = () => {
    try {
      setOrders(getOrders());
    } catch (e) {
      console.error('Failed to load orders:', e);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = (id, newStatus) => {
    try {
      const order = orders.find(o => o.id === id || o.order_number === id);
      const oldStatus = order?.status;
      updateOrderStatus(id, newStatus);
      setOrders(prev => prev.map(o => (o.id === id || o.order_number === id) ? { ...o, status: newStatus } : o));
      if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
        addToast('تم إلغاء الطلبية واسترجاع المنتجات إلى المخزون بنجاح!', 'info');
      } else if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
        addToast('تمت إعادة تفعيل الطلبية وخصم المنتجات من المخزون!', 'success');
      } else {
        addToast('Statut de la commande mis à jour!', 'success');
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
      addToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const handleDeleteOrder = (id, orderNum) => {
    if (window.confirm(`Supprimer la commande ${orderNum} ?\nهل أنت متأكد من حذف هذا الطلب؟`)) {
      try {
        deleteOrder(id);
        setOrders(prev => prev.filter(o => o.id !== id && o.order_number !== id));
        addToast(`Commande ${orderNum} supprimée!`, 'success');
      } catch (err) {
        console.error('Failed to delete order:', err);
        addToast('Erreur lors de la suppression', 'error');
      }
    }
  };

  const statusMap = {
    pending: { label: 'En attente / معلق', bg: '#fef3c7', color: '#92400e' },
    confirmed: { label: 'Confirmé / مؤكد', bg: '#dbeafe', color: '#1e40af' },
    shipped: { label: 'Expédié / تم الإرسال', bg: '#e0e7ff', color: '#3730a3' },
    delivered: { label: 'Livré / تم التوصيل', bg: '#ecfdf5', color: '#065f46' },
    cancelled: { label: 'Annulé / ملغى', bg: '#fee2e2', color: '#991b1b' },
  };

  const filtered = orders.filter(o => {
    const matchStatus = !statusFilter || o.status === statusFilter;
    const matchSearch = !search ||
      o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone?.includes(search) ||
      o.wilaya?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="admin-page-title" style={{ margin: 0 }}>Commandes Clients</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--gray)' }}>
            Total: {orders.length} commandes ({orders.filter(o => o.status === 'pending').length} en attente)
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="admin-card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-light)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Rechercher (Nom, N° Commande, Téléphone, Wilaya)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="admin-search-orders"
            />
          </div>

          <select
            className="form-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            id="admin-filter-orders-status"
          >
            <option value="">Tous les statuts (جميع الحالات)</option>
            <option value="pending">En attente (معلق)</option>
            <option value="confirmed">Confirmé (مؤكد)</option>
            <option value="shipped">Expédié (تم الإرسال)</option>
            <option value="delivered">Livré (تم التوصيل)</option>
            <option value="cancelled">Annulé (ملغى)</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="admin-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>N° Commande</th>
                <th>Client</th>
                <th>Wilaya</th>
                <th>Articles commandés (المقاس واللون)</th>
                <th>Total</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--gray-light)', padding: 40 }}>
                    <ShoppingCart size={40} style={{ opacity: 0.4, margin: '0 auto 10px', display: 'block' }} />
                    Aucune commande trouvée
                  </td>
                </tr>
              ) : filtered.map(o => {
                const isExp = expanded === o.id;
                const sInfo = statusMap[o.status] || { label: o.status, bg: '#f3f4f6', color: '#374151' };

                return (
                  <React.Fragment key={o.id}>
                    <tr style={{ background: isExp ? 'rgba(212,175,55,0.04)' : undefined }}>
                      <td>
                        <strong style={{ fontFamily: 'monospace', fontSize: 13 }}>{o.order_number}</strong>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{o.customer_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={11} />
                          <a href={`tel:${o.customer_phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {o.customer_phone}
                          </a>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{o.wilaya}</div>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          marginTop: 3,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: o.delivery_type === 'office' ? '#eff6ff' : '#f0fdf4',
                          color: o.delivery_type === 'office' ? '#1e40af' : '#166534',
                          fontWeight: 700
                        }}>
                          {o.delivery_type === 'office' ? '🏢 مكتب التوصيل' : '🏠 لباب المنزل'}
                        </div>
                        {o.delivery_type === 'home' && o.commune && (
                          <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>{o.commune}</div>
                        )}
                      </td>
                      <td>
                        {/* Highlighting sizes & colors at a glance! */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 260 }}>
                          {o.items?.map((it, idx) => (
                            <div key={idx} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 600 }}>{it.name} ×{it.qty}</span>
                              {it.size && (
                                <span style={{
                                  background: 'var(--black)',
                                  color: 'var(--gold)',
                                  padding: '1px 5px',
                                  borderRadius: 3,
                                  fontSize: 11,
                                  fontWeight: 800
                                }}>
                                  المقاس: {it.size}
                                </span>
                              )}
                              {it.color && (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  background: 'var(--white-warm)',
                                  border: '1px solid var(--gray-border)',
                                  padding: '1px 5px',
                                  borderRadius: 3,
                                  fontSize: 11
                                }}>
                                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: it.color, border: '1px solid rgba(0,0,0,0.2)' }} />
                                  {it.color}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>
                        <strong style={{
                          fontSize: 14,
                          textDecoration: o.status === 'cancelled' ? 'line-through' : 'none',
                          color: o.status === 'cancelled' ? 'var(--gray-light)' : 'var(--black)'
                        }}>
                          {o.total?.toLocaleString()} DZD
                        </strong>
                        {o.status === 'cancelled' && (
                          <div style={{ fontSize: 10, color: '#dc2626', fontWeight: 800 }}>غير محسوب (ملغى)</div>
                        )}
                      </td>
                      <td>
                        <select
                          className="form-select"
                          style={{
                            padding: '4px 8px',
                            fontSize: 12,
                            fontWeight: 700,
                            borderRadius: 6,
                            background: sInfo.bg,
                            color: sInfo.color,
                            border: `1px solid ${sInfo.color}33`,
                            cursor: 'pointer'
                          }}
                          value={o.status}
                          onChange={e => handleStatusChange(o.id, e.target.value)}
                        >
                          <option value="pending">En attente (معلق)</option>
                          <option value="confirmed">Confirmé (مؤكد)</option>
                          <option value="shipped">Expédié (تم الإرسال)</option>
                          <option value="delivered">Livré (تم التوصيل)</option>
                          <option value="cancelled">Annulé (ملغى)</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ fontSize: 12, color: 'var(--gray-light)' }}>
                          {new Date(o.created_at).toLocaleDateString('fr-DZ', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setExpanded(isExp ? null : o.id)}
                            title={isExp ? 'Fermer' : 'Détails complets'}
                          >
                            {isExp ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteOrder(o.id, o.order_number)}
                            title="Supprimer la commande"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Detailed Order Expansion Card */}
                    {isExp && (
                      <tr>
                        <td colSpan={8} style={{ padding: 0 }}>
                          <div style={{
                            padding: 20,
                            background: 'var(--white-warm)',
                            borderTop: '1px dashed var(--gray-border)',
                            borderBottom: '2px solid var(--gray-border)'
                          }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 16 }}>
                              {/* Customer & Delivery details */}
                              <div style={{ background: 'var(--white)', padding: 14, borderRadius: 8, border: '1px solid var(--gray-border)' }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--gold-dark)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <MapPin size={14} /> Informations de Livraison (معلومات التوصيل)
                                </div>
                                <p style={{ margin: '0 0 4px', fontSize: 13 }}><strong>Client:</strong> {o.customer_name}</p>
                                <p style={{ margin: '0 0 4px', fontSize: 13 }}><strong>Téléphone:</strong> <a href={`tel:${o.customer_phone}`}>{o.customer_phone}</a></p>
                                {o.customer_email && <p style={{ margin: '0 0 4px', fontSize: 13 }}><strong>Email:</strong> {o.customer_email}</p>}
                                <p style={{ margin: '0 0 4px', fontSize: 13 }}><strong>Wilaya:</strong> {o.wilaya}</p>
                                <p style={{ margin: '0 0 6px', fontSize: 13 }}>
                                  <strong>Mode de livraison:</strong>{' '}
                                  <span style={{
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    background: o.delivery_type === 'office' ? '#eff6ff' : '#f0fdf4',
                                    color: o.delivery_type === 'office' ? '#1e40af' : '#166534',
                                    fontWeight: 700,
                                    fontSize: 12
                                  }}>
                                    {o.delivery_type === 'office' ? '🏢 مكتب التوصيل (Stop Desk)' : '🏠 التوصيل لباب المنزل (À Domicile)'}
                                  </span>
                                </p>
                                {o.delivery_type !== 'office' ? (
                                  <>
                                    {o.commune && <p style={{ margin: '0 0 4px', fontSize: 13 }}><strong>Commune (البلدية):</strong> {o.commune}</p>}
                                    {o.address && <p style={{ margin: '0 0 4px', fontSize: 13 }}><strong>Adresse (العنوان):</strong> {o.address}</p>}
                                  </>
                                ) : (
                                  <p style={{ margin: '0 0 4px', fontSize: 13, color: '#1e40af' }}>
                                    <em>مكتب التوصيل المعتمد بالولاية (Stop Desk)</em>
                                  </p>
                                )}
                                {o.note && (
                                  <div style={{ marginTop: 8, padding: 8, background: '#fef3c7', borderRadius: 4, fontSize: 12, color: '#92400e' }}>
                                    <strong>ملاحظة العميل:</strong> {o.note}
                                  </div>
                                )}
                              </div>

                              {/* Order financial details */}
                              <div style={{ background: 'var(--white)', padding: 14, borderRadius: 8, border: '1px solid var(--gray-border)' }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--gold-dark)', textTransform: 'uppercase', marginBottom: 8 }}>
                                  Montants (المبالغ)
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                                  <span>Sous-total articles:</span>
                                  <strong>{o.subtotal?.toLocaleString()} DZD</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                                  <span>Frais de livraison ({o.wilaya}):</span>
                                  <strong>{o.delivery_price?.toLocaleString()} DZD</strong>
                                </div>
                                <div style={{ height: 1, background: 'var(--gray-border)', margin: '8px 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 900 }}>
                                  <span>Total à payer:</span>
                                  <span style={{ color: 'var(--gold-dark)' }}>{o.total?.toLocaleString()} DZD</span>
                                </div>
                              </div>
                            </div>

                            {/* Ordered items with prominent size and color */}
                            <div style={{ background: 'var(--white)', padding: 14, borderRadius: 8, border: '1px solid var(--gray-border)' }}>
                              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--black)', textTransform: 'uppercase', marginBottom: 10 }}>
                                Articles demandés et options choisies (المنتجات والمقاس واللون المطلوبين)
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {o.items?.map((it, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '10px 12px',
                                      background: 'var(--white-warm)',
                                      borderRadius: 6,
                                      border: '1px solid var(--gray-border)',
                                      flexWrap: 'wrap',
                                      gap: 10
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                      {it.image && (
                                        <img src={it.image} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--gray-border)' }} />
                                      )}
                                      <div>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>{it.name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--gray)' }}>
                                          Prix unitaire: {it.price?.toLocaleString()} DZD · Quantité: <strong>{it.qty}</strong>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Prominent customer selection: Size & Color */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                      <div style={{
                                        background: 'var(--black)',
                                        color: '#fff',
                                        padding: '4px 10px',
                                        borderRadius: 6,
                                        fontSize: 13,
                                        fontWeight: 800,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6
                                      }}>
                                        <span style={{ color: 'var(--gold)', fontSize: 11 }}>المقاس:</span>
                                        <span>{it.size || 'Non spécifié'}</span>
                                      </div>

                                      <div style={{
                                        background: 'var(--white)',
                                        border: '1px solid var(--gray-border)',
                                        padding: '4px 10px',
                                        borderRadius: 6,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6
                                      }}>
                                        <span style={{ color: 'var(--gray)', fontSize: 11 }}>اللون:</span>
                                        {it.color ? (
                                          <>
                                            <span style={{ width: 14, height: 14, borderRadius: '50%', background: it.color, border: '1px solid rgba(0,0,0,0.2)' }} />
                                            <span>{it.color}</span>
                                          </>
                                        ) : (
                                          <span>Non spécifié</span>
                                        )}
                                      </div>

                                      <strong style={{ fontSize: 14, minWidth: 90, textAlign: 'right' }}>
                                        {(it.price * it.qty).toLocaleString()} DZD
                                      </strong>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
