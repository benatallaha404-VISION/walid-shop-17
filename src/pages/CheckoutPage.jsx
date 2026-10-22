// pages/CheckoutPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Truck, Home, Building2 } from 'lucide-react';
import emailjs from 'emailjs-com';
import { useApp } from '../context/AppContext.jsx';
import { createOrder, getWilayas, getAllSettings } from '../db.js';

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart, addToast } = useApp();
  const navigate = useNavigate();

  const [wilayas, setWilayas] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    delivery_type: 'home', // 'office' (مكتب التوصيل) or 'home' (باب المنزل)
    wilaya: '',
    commune: '',
    address: '',
    note: '',
  });

  const { dbReady } = useApp();

  useEffect(() => {
    try {
      const activeWilayas = getWilayas(true);
      if (activeWilayas && activeWilayas.length > 0) {
        setWilayas(activeWilayas);
      }
      setSettings(getAllSettings());
    } catch (e) {
      console.error('Error loading checkout data:', e);
    }
  }, [dbReady]);

  const selectedWilaya = wilayas.find(w => w.name === form.wilaya);
  const deliveryPrice = selectedWilaya?.delivery_price || 0;
  const total = cartTotal + deliveryPrice;

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) { addToast('Votre panier est vide', 'error'); return; }
    if (!form.wilaya) { addToast('Veuillez choisir une wilaya / يرجى اختيار الولاية', 'error'); return; }

    if (form.delivery_type === 'home') {
      if (!form.commune?.trim() || !form.address?.trim()) {
        addToast('يرجى ملء البلدية والعنوان للتوصيل لباب المنزل', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      const finalCommune = form.delivery_type === 'home' ? form.commune.trim() : 'مكتب التوصيل (Stop Desk)';
      const finalAddress = form.delivery_type === 'home' ? form.address.trim() : 'استلام من مكتب التوصيل (Stop Desk)';

      const orderData = {
        ...form,
        commune: finalCommune,
        address: finalAddress,
        delivery_type: form.delivery_type,
        items: cart,
        subtotal: cartTotal,
        delivery_price: deliveryPrice,
        total,
      };

      const orderNumber = createOrder(orderData);

      // Send email via EmailJS
      const serviceId = settings.emailjs_service_id;
      const templateId = settings.emailjs_template_id;
      const publicKey = settings.emailjs_public_key;

      if (serviceId && templateId && publicKey &&
          serviceId !== 'YOUR_SERVICE_ID') {
        try {
          const itemsList = cart.map(i =>
            `${i.name} x${i.qty} (Taille: ${i.size || 'N/A'}, Couleur: ${i.color || 'N/A'}) — ${(i.price * i.qty).toLocaleString()} DZD`
          ).join('\n');

          const deliveryTypeLabel = form.delivery_type === 'home'
            ? 'التوصيل لباب المنزل (À Domicile)'
            : 'التوصيل إلى مكتب التوصيل (Stop Desk)';

          await emailjs.send(serviceId, templateId, {
            order_number: orderNumber,
            customer_name: form.customer_name,
            customer_phone: form.customer_phone,
            customer_email: form.customer_email || 'N/A',
            delivery_type: deliveryTypeLabel,
            wilaya: form.wilaya,
            commune: finalCommune,
            address: finalAddress,
            note: form.note || 'Aucune',
            items_list: itemsList,
            subtotal: `${cartTotal.toLocaleString()} DZD`,
            delivery_price: `${deliveryPrice.toLocaleString()} DZD`,
            total: `${total.toLocaleString()} DZD`,
            store_name: 'Walid Shop',
          }, publicKey);
        } catch (emailErr) {
          console.warn('Email sending failed:', emailErr);
        }
      }

      clearCart();
      setSuccess(orderNumber);
    } catch (err) {
      console.error(err);
      addToast('Erreur lors de la commande. Réessayez.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0 && !success) {
    return (
      <div className="checkout-page">
        <div className="container" style={{ textAlign: 'center', paddingTop: 60 }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Votre panier est vide</h2>
          <button className="btn btn-primary" onClick={() => navigate('/')} id="back-to-shop-btn">
            Retour au Shop
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="checkout-page">
        <div className="container" style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'var(--black)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 24px', color: 'var(--gold)'
          }}>
            <CheckCircle size={40} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 10 }}>Commande Confirmée!</h1>
          <p style={{ color: 'var(--gray)', marginBottom: 8, fontSize: 15 }}>
            Numéro de commande: <strong style={{ color: 'var(--black)' }}>{success}</strong>
          </p>
          <p style={{ color: 'var(--gray)', marginBottom: 28, fontSize: 14 }}>
            Nous vous contacterons bientôt pour confirmer la livraison.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/')} id="order-success-btn">
            Continuer les achats
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="checkout-page">
      <div className="page-header">
        <div className="container">
          <h1>Commander</h1>
          <div className="breadcrumb">
            <a href="/">Shop</a>
            <span>/</span>
            <span>Checkout</span>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 40 }}>
        <form onSubmit={handleSubmit}>
          <div className="checkout-grid">
            {/* Left */}
            <div>
              {/* Personal info */}
              <div className="checkout-section">
                <h3>Informations Personnelles</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nom complet *</label>
                    <input
                      className="form-input"
                      name="customer_name"
                      value={form.customer_name}
                      onChange={handleChange}
                      required
                      placeholder="Votre nom"
                      id="checkout-name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Téléphone *</label>
                    <input
                      className="form-input"
                      name="customer_phone"
                      value={form.customer_phone}
                      onChange={handleChange}
                      required
                      placeholder="0555 XXX XXX"
                      type="tel"
                      id="checkout-phone"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery */}
              <div className="checkout-section">
                <h3>
                  <Truck size={16} style={{ marginRight: 8, display: 'inline' }} />
                  Informations de Livraison (معلومات التوصيل)
                </h3>

                {/* Wilaya Selection */}
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>Wilaya (الولاية) *</label>
                  <select
                    className="form-select"
                    name="wilaya"
                    value={form.wilaya}
                    onChange={handleChange}
                    required
                    id="checkout-wilaya"
                  >
                    <option value="">Choisir une wilaya / اختر الولاية...</option>
                    {wilayas.map(w => (
                      <option key={w.id} value={w.name}>
                        {w.name} — {w.delivery_price.toLocaleString()} DZD
                      </option>
                    ))}
                  </select>
                </div>

                {/* Delivery Type Option Selector */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                    Mode de livraison (طريقة التوصيل) *
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12
                  }}>
                    {/* Office Delivery Option */}
                    <div
                      onClick={() => setForm(prev => ({ ...prev, delivery_type: 'office' }))}
                      id="delivery-type-office"
                      style={{
                        padding: '14px 16px',
                        borderRadius: 10,
                        border: form.delivery_type === 'office'
                          ? '2px solid var(--black)'
                          : '1px solid var(--gray-border)',
                        background: form.delivery_type === 'office'
                          ? 'var(--white-warm)'
                          : 'var(--white)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        transition: 'all 0.2s ease',
                        boxShadow: form.delivery_type === 'office'
                          ? '0 2px 8px rgba(0,0,0,0.06)'
                          : 'none'
                      }}
                    >
                      <input
                        type="radio"
                        name="delivery_type_radio"
                        checked={form.delivery_type === 'office'}
                        onChange={() => setForm(prev => ({ ...prev, delivery_type: 'office' }))}
                        style={{ marginTop: 3, accentColor: 'var(--black)' }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 14 }}>
                          <Building2 size={16} style={{ color: 'var(--gold-dark)' }} />
                          التوصيل إلى مكتب التوصيل
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
                          Bureau / Stop Desk (استلام من المكتب)
                        </div>
                      </div>
                    </div>

                    {/* Home Delivery Option */}
                    <div
                      onClick={() => setForm(prev => ({ ...prev, delivery_type: 'home' }))}
                      id="delivery-type-home"
                      style={{
                        padding: '14px 16px',
                        borderRadius: 10,
                        border: form.delivery_type === 'home'
                          ? '2px solid var(--black)'
                          : '1px solid var(--gray-border)',
                        background: form.delivery_type === 'home'
                          ? 'var(--white-warm)'
                          : 'var(--white)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        transition: 'all 0.2s ease',
                        boxShadow: form.delivery_type === 'home'
                          ? '0 2px 8px rgba(0,0,0,0.06)'
                          : 'none'
                      }}
                    >
                      <input
                        type="radio"
                        name="delivery_type_radio"
                        checked={form.delivery_type === 'home'}
                        onChange={() => setForm(prev => ({ ...prev, delivery_type: 'home' }))}
                        style={{ marginTop: 3, accentColor: 'var(--black)' }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 14 }}>
                          <Home size={16} style={{ color: 'var(--gold-dark)' }} />
                          التوصيل لباب المنزل
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
                          À Domicile (توصيل مباشر إلى باب دارك)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conditional Fields: When Home delivery is chosen, Address & Commune appear */}
                {form.delivery_type === 'home' ? (
                  <div style={{ animation: 'fadeIn 0.25s ease' }}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Commune (البلدية) *</label>
                        <input
                          className="form-input"
                          name="commune"
                          value={form.commune}
                          onChange={handleChange}
                          placeholder="Votre commune / اسم البلدية"
                          required
                          id="checkout-commune"
                        />
                      </div>
                      <div className="form-group">
                        <label>Adresse (العنوان) *</label>
                        <input
                          className="form-input"
                          name="address"
                          value={form.address}
                          onChange={handleChange}
                          placeholder="Adresse précise / الحي والشارع ورقم المنزل"
                          required
                          id="checkout-address"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '12px 14px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    color: '#334155',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 16
                  }}>
                    <Building2 size={18} style={{ color: 'var(--gold-dark)', flexShrink: 0 }} />
                    <span>
                      <strong>استلام من مكتب التوصيل:</strong> سيتم إرسال طلبيتك إلى مكتب التوصيل بالولاية، وسيتصل بكم الموزع لاستلامها فور وصولها.
                    </span>
                  </div>
                )}

                <div className="form-group">
                  <label>Note (optionnel / ملاحظة إضافية)</label>
                  <textarea
                    className="form-textarea"
                    name="note"
                    value={form.note}
                    onChange={handleChange}
                    placeholder="Instructions supplémentaires..."
                    id="checkout-note"
                  />
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="order-summary-card">
              <h3>Récapitulatif</h3>
              <div style={{ marginBottom: 16 }}>
                {cart.map(item => (
                  <div key={item.key} className="summary-item">
                    <div className="summary-item-name">
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-light)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        {item.size && (
                          <span style={{ background: 'var(--white-warm)', border: '1px solid var(--gray-border)', padding: '2px 6px', borderRadius: 4, fontWeight: 700, color: 'var(--black)' }}>
                            Taille: {item.size}
                          </span>
                        )}
                        {item.color && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--white-warm)', border: '1px solid var(--gray-border)', padding: '2px 6px', borderRadius: 4, color: 'var(--black)' }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, border: '1px solid rgba(0,0,0,0.2)' }} />
                            {item.color}
                          </span>
                        )}
                        <span style={{ fontWeight: 600 }}>×{item.qty}</span>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, flexShrink: 0 }}>
                      {(item.price * item.qty).toLocaleString()} DZD
                    </div>
                  </div>
                ))}
              </div>

              <div className="divider" />

              <div className="summary-line">
                <span>Sous-total</span>
                <span>{cartTotal.toLocaleString()} DZD</span>
              </div>
              <div className="summary-line">
                <span>Mode de livraison</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>
                  {form.delivery_type === 'home' ? '🏠 لباب المنزل' : '🏢 مكتب التوصيل'}
                </span>
              </div>
              <div className="summary-line">
                <span>Livraison</span>
                <span>{form.wilaya ? `${deliveryPrice.toLocaleString()} DZD` : '—'}</span>
              </div>
              <div className="summary-line total">
                <span>Total</span>
                <span>{total.toLocaleString()} DZD</span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 20, padding: '14px', fontSize: 15 }}
                disabled={loading}
                id="place-order-btn"
              >
                {loading ? 'En cours...' : 'Confirmer la commande'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
