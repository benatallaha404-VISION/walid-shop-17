// components/Header.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Phone, Info, X, Menu } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import CartDrawer from './CartDrawer.jsx';
import logoImg from '../assets/logo.png';

export default function Header() {
  const { cartCount, cartOpen, setCartOpen } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container header-inner">
          {/* Logo */}
          <Link to="/" className="logo" title="Retour à l'accueil — العودة للمتجر">
            <img src={logoImg} alt="Walid Shop" className="logo-icon" />
            <span className="logo-text">Walid <span>Shop</span></span>
          </Link>

          {/* Search — desktop only */}
          <form className="header-search" onSubmit={handleSearch}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher des produits..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="header-search-input"
              title="Rechercher un produit dans le magasin"
            />
          </form>

          {/* Actions */}
          <div className="header-actions">
            {/* Mobile search toggle */}
            <button
              className="icon-btn mobile-search-btn"
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="Rechercher"
              id="mobile-search-toggle"
              title="Rechercher"
            >
              {mobileMenuOpen ? <X size={19} /> : <Search size={19} />}
            </button>

            {/* Contact info button - desktop */}
            <Link
              to="/contact"
              className="icon-btn header-contact-desktop"
              aria-label="Contact"
              id="header-contact-btn"
              title="Contactez-nous — تواصل معنا"
            >
              <Info size={19} />
            </Link>

            {/* Phone shortcut */}
            <Link
              to="/contact"
              className="icon-btn"
              aria-label="Téléphone"
              id="header-phone-btn"
              title="Appeler le magasin — اتصل بنا"
            >
              <Phone size={19} />
            </Link>

            {/* Cart */}
            <button
              className="icon-btn"
              onClick={() => setCartOpen(true)}
              aria-label="Panier"
              id="header-cart-btn"
              title="Voir mon panier — عربة التسوق"
            >
              <ShoppingBag size={19} />
              {cartCount > 0 && <span className="badge">{cartCount > 9 ? '9+' : cartCount}</span>}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {mobileMenuOpen && (
          <div className="mobile-search-bar">
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, width: '100%' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-light)' }} />
                <input
                  type="text"
                  placeholder="Rechercher des produits..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%', padding: '10px 12px 10px 36px',
                    border: '1.5px solid var(--gray-border)', borderRadius: 8,
                    fontFamily: 'var(--font)', fontSize: 14, outline: 'none',
                    background: 'var(--white-soft)'
                  }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 18px' }}>
                بحث
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Cart Drawer */}
      {cartOpen && <CartDrawer />}
    </>
  );
}
