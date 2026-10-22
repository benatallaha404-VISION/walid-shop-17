// context/AppContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initDB } from '../db.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [dbReady, setDbReady] = useState(false);
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('walid_cart') || '[]'); } catch { return []; }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    initDB()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error('Database initialization error:', err);
        setDbReady(true);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem('walid_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback((product, size, color, qty = 1) => {
    const key = `${product.id}-${size}-${color}`;
    setCart(prev => {
      const existing = prev.find(i => i.key === key);
      if (existing) {
        return prev.map(i => i.key === key ? { ...i, qty: i.qty + qty } : i);
      }
      return [...prev, {
        key,
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || '',
        size,
        color,
        qty,
      }];
    });
    addToast(`${product.name} ajouté au panier`, 'success');
  }, []);

  const removeFromCart = useCallback((key) => {
    setCart(prev => prev.filter(i => i.key !== key));
  }, []);

  const updateCartQty = useCallback((key, qty) => {
    if (qty <= 0) {
      removeFromCart(key);
      return;
    }
    setCart(prev => prev.map(i => i.key === key ? { ...i, qty } : i));
  }, [removeFromCart]);

  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  return (
    <AppContext.Provider value={{
      dbReady,
      cart, cartCount, cartTotal,
      cartOpen, setCartOpen,
      addToCart, removeFromCart, updateCartQty, clearCart,
      toasts, addToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
