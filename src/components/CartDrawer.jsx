// components/CartDrawer.jsx
import React from 'react';
import { X, ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer() {
  const { cart, cartTotal, setCartOpen, removeFromCart, updateCartQty } = useApp();
  const navigate = useNavigate();

  return (
    <>
      <div className="cart-backdrop" onClick={() => setCartOpen(false)} />
      <aside className="cart-drawer" role="dialog" aria-label="Panier">
        {/* Header */}
        <div className="cart-header">
          <h2>Mon Panier</h2>
          <button className="icon-btn" onClick={() => setCartOpen(false)} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <ShoppingBag size={48} />
              <p>Votre panier est vide</p>
            </div>
          ) : (
            cart.map(item => (
              <div className="cart-item" key={item.key}>
                <img
                  src={item.image || 'https://placehold.co/72x80?text=IMG'}
                  alt={item.name}
                  className="cart-item-img"
                />
                <div className="cart-item-details">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-meta">
                    {item.size && <span>Taille: {item.size}</span>}
                    {item.size && item.color && ' · '}
                    {item.color && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{
                          display: 'inline-block', width: 10, height: 10,
                          borderRadius: '50%', background: item.color,
                          border: '1px solid rgba(0,0,0,0.15)'
                        }} />
                      </span>
                    )}
                  </div>
                  <div className="cart-item-footer">
                    <span className="cart-item-price">{(item.price * item.qty).toLocaleString()} DZD</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        className="icon-btn"
                        style={{ width: 28, height: 28 }}
                        onClick={() => updateCartQty(item.key, item.qty - 1)}
                        aria-label="Diminuer"
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: 13, fontWeight: 700, minWidth: 18, textAlign: 'center' }}>
                        {item.qty}
                      </span>
                      <button
                        className="icon-btn"
                        style={{ width: 28, height: 28 }}
                        onClick={() => updateCartQty(item.key, item.qty + 1)}
                        aria-label="Augmenter"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        className="icon-btn"
                        style={{ width: 28, height: 28, color: '#ef4444' }}
                        onClick={() => removeFromCart(item.key)}
                        aria-label="Supprimer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total-row">
              <span className="cart-total-label">Sous-total</span>
              <span className="cart-total-value">{cartTotal.toLocaleString()} DZD</span>
            </div>
            <button
              className="btn btn-primary w-full"
              style={{ width: '100%', justifyContent: 'center', marginBottom: 10, fontSize: 15, padding: '14px' }}
              onClick={() => { setCartOpen(false); navigate('/checkout'); }}
              id="cart-checkout-btn"
            >
              Commander maintenant
            </button>
            <button
              className="btn btn-ghost w-full"
              style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}
              onClick={() => setCartOpen(false)}
            >
              Continuer les achats
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
