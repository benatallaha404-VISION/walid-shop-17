// components/MobileBottomNav.jsx
import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, PhoneCall, Search } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

export default function MobileBottomNav({ onSearchClick }) {
  const { cartCount, setCartOpen } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show bottom nav on admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  // On product detail page, we hide it or show simplified version so it doesn't clash with sticky buy bar
  const isProductPage = location.pathname.startsWith('/product/');

  if (isProductPage) {
    return null;
  }

  return (
    <nav className="mobile-bottom-nav" aria-label="Navigation mobile">
      <NavLink
        to="/"
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        id="mobile-nav-home"
      >
        <Home size={20} />
        <span>المتجر</span>
      </NavLink>

      <button
        type="button"
        className="mobile-nav-item"
        onClick={() => {
          if (location.pathname !== '/') {
            navigate('/');
            setTimeout(() => {
              window.scrollTo({ top: 350, behavior: 'smooth' });
            }, 100);
          } else {
            const el = document.getElementById('hero-section');
            if (el) {
              window.scrollTo({ top: el.offsetHeight - 50, behavior: 'smooth' });
            }
          }
        }}
        id="mobile-nav-products"
      >
        <Search size={20} />
        <span>تصفح</span>
      </button>

      <button
        type="button"
        className="mobile-nav-item mobile-nav-cart"
        onClick={() => setCartOpen(true)}
        id="mobile-nav-cart"
      >
        <div className="mobile-cart-icon-wrap">
          <ShoppingBag size={20} />
          {cartCount > 0 && (
            <span className="mobile-nav-badge">{cartCount > 9 ? '9+' : cartCount}</span>
          )}
        </div>
        <span>السلة</span>
      </button>

      <NavLink
        to="/contact"
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        id="mobile-nav-contact"
      >
        <PhoneCall size={20} />
        <span>اتصل بنا</span>
      </NavLink>
    </nav>
  );
}
