import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag, Filter, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { getProducts, getCategories, getAllSettings } from '../db.js';
import BrandLogosTicker from '../components/BrandLogos.jsx';
import GoogleMapEmbed from '../components/GoogleMapEmbed.jsx';

function HeroSlider({ title, subtitle, tag, image }) {
  const currentTitle = title || 'Walid Shop';
  const titleLines = currentTitle.split('\n');

  return (
    <section className="hero" id="hero-section">
      {image ? (
        <img src={image} alt="Hero" className="hero-image" />
      ) : (
        <div style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #111 100%)',
          position: 'absolute', inset: 0
        }} />
      )}
      <div className="hero-overlay">
        <div className="hero-content">
          {tag && <span className="hero-tag">{tag}</span>}
          <h1 className="hero-title">
            {titleLines.map((line, i) => (
              <React.Fragment key={i}>
                {i === 1 ? <span>{line}</span> : line}
                {i < titleLines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </h1>
          <p className="hero-subtitle">{subtitle || 'متجركم المفضل للأناقة والموضة الرجالية'}</p>
        </div>
      </div>
      <BrandLogosTicker />
    </section>
  );
}

function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useApp();

  const handleAddToCart = (e) => {
    e.stopPropagation();
    const size = product.sizes?.[0] || '';
    const color = product.colors?.[0] || '';
    addToCart(product, size, color, 1);
  };

  return (
    <article
      className="product-card"
      onClick={() => navigate(`/product/${product.id}`)}
      id={`product-card-${product.id}`}
      title={`Voir ${product.name} — عرض تفاصيل المنتج`}
    >
      <div className="product-img-wrap">
        <img
          src={product.images?.[0] || 'https://placehold.co/400x533?text=No+Image'}
          alt={product.name}
          loading="lazy"
        />
        {product.badge && (
          <span className={`product-badge ${product.badge === 'Sale' ? 'sale' : ''}`}>
            {product.badge}
          </span>
        )}
      </div>
      <div className="product-info">
        <div className="product-category">{product.category_name || 'Mode'}</div>
        <div className="product-name">{product.name}</div>
        <div className="product-price-row">
          <span className="product-price">{product.price?.toLocaleString()} DZD</span>
          {product.old_price && (
            <span className="product-old-price">{product.old_price?.toLocaleString()} DZD</span>
          )}
        </div>
        {product.colors?.length > 0 && (
          <div className="product-colors">
            {product.colors.slice(0, 4).map((c, i) => (
              <span
                key={i}
                className="color-dot"
                style={{ background: c }}
                title={c}
              />
            ))}
          </div>
        )}
        {/* Always-visible Add to Cart button */}
        <button
          className="btn btn-primary btn-sm product-add-btn"
          onClick={handleAddToCart}
          id={`quick-add-${product.id}`}
          title={`Ajouter ${product.name} au panier`}
        >
          <ShoppingBag size={13} />
          Ajouter au panier
        </button>
      </div>
    </article>
  );
}

// Category filter dropdown
function CategoryDropdown({ categories, activeCategory, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const active = categories.find(c => c.id === activeCategory);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="btn btn-outline btn-sm"
        onClick={() => setOpen(v => !v)}
        id="category-filter-btn"
        title="Filtrer par catégorie — تصفية حسب الفئة"
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <Filter size={14} />
        {active ? active.name : 'Toutes les catégories'}
        <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          background: 'var(--white)', border: '1px solid var(--gray-border)',
          borderRadius: 8, minWidth: 200, zIndex: 200,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <button
            className="category-dropdown-item"
            onClick={() => { onSelect(null); setOpen(false); }}
            style={{ background: activeCategory === null ? 'var(--white-soft)' : undefined }}
          >
            {activeCategory === null && <Check size={13} style={{ color: 'var(--gold-dark)' }} />}
            <span>Toutes les catégories</span>
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className="category-dropdown-item"
              onClick={() => { onSelect(cat.id); setOpen(false); }}
              style={{ background: activeCategory === cat.id ? 'var(--white-soft)' : undefined }}
              title={`Filtrer: ${cat.name}`}
            >
              {activeCategory === cat.id && <Check size={13} style={{ color: 'var(--gold-dark)' }} />}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  const { dbReady } = useApp();
  const [searchParams] = useSearchParams();
  const initialSettings = getAllSettings();
  const [products, setProducts] = useState(() => getProducts());
  const [categories, setCategories] = useState(() => getCategories(true));
  const [activeCategory, setActiveCategory] = useState(null);
  const [sort, setSort] = useState('newest');
  const [heroData, setHeroData] = useState(() => ({
    title: initialSettings.hero_title || 'Walid Shop',
    subtitle: initialSettings.hero_subtitle || 'متجركم المفضل للأناقة والموضة الرجالية',
    tag: initialSettings.hero_tag || 'Walid Shop Collection',
    image: initialSettings.hero_image || ''
  }));
  const [storeSettings, setStoreSettings] = useState(() => initialSettings);
  const [loading, setLoading] = useState(false);

  const searchQuery = searchParams.get('search') || '';

  const loadData = useCallback(() => {
    try {
      const cats = getCategories(true);
      if (cats) setCategories(cats);

      const prods = getProducts({
        categoryId: activeCategory,
        search: searchQuery,
        sort,
      });
      if (prods) setProducts(prods);

      const allSettings = getAllSettings();
      setStoreSettings(allSettings);
      setHeroData({
        title: allSettings.hero_title || 'Walid Shop',
        subtitle: allSettings.hero_subtitle || 'متجركم المفضل للأناقة والموضة الرجالية',
        tag: allSettings.hero_tag || 'Walid Shop Collection',
        image: allSettings.hero_image || ''
      });
    } catch (e) {
      console.error('Error loading shop data:', e);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, sort, searchQuery]);

  useEffect(() => {
    loadData();
    const handleStoreChange = () => loadData();
    window.addEventListener('walid_shop_store_change', handleStoreChange);
    return () => window.removeEventListener('walid_shop_store_change', handleStoreChange);
  }, [dbReady, loadData]);

  return (
    <main>
      <HeroSlider {...heroData} />

      {/* Filter Bar */}
      <div className="filter-section">
        <div className="container filter-inner">
          <CategoryDropdown
            categories={categories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />
          <div className="filter-right">
            <select
              className="sort-select"
              value={sort}
              onChange={e => setSort(e.target.value)}
              id="sort-select"
              title="Trier les produits"
            >
              <option value="newest">Nouveautés</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products */}
      <section className="shop-section" id="products-section">
        <div className="container">
          {searchQuery && (
            <p style={{ marginBottom: 20, color: 'var(--gray)', fontSize: 14 }}>
              Résultats pour <strong>"{searchQuery}"</strong> — {products.length} produit(s)
            </p>
          )}

          {loading ? (
            <div className="spinner" />
          ) : products.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={60} />
              <h3>Aucun produit trouvé</h3>
              <p>Essayez une autre catégorie ou recherche</p>
            </div>
          ) : (
            <div className="products-grid" id="products-grid">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* Location Section */}
      <section className="location-section" id="location-section" style={{ padding: '60px 0 80px', borderTop: '1px solid var(--gray-border)', background: 'var(--white)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold-dark)', display: 'block', marginBottom: 6 }}>
              Visitez Notre Magasin
            </span>
            <h2 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 10px', color: 'var(--black)' }}>
              موقعنا / Notre Emplacement
            </h2>
            {storeSettings.store_address && (
              <p style={{ color: 'var(--gray)', fontSize: 15, margin: 0 }}>
                {storeSettings.store_address}
              </p>
            )}
          </div>

          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            {storeSettings.store_map_embed ? (
              <GoogleMapEmbed embedCodeOrUrl={storeSettings.store_map_embed} height={420} />
            ) : (
              <div style={{
                padding: '48px 24px', textAlign: 'center',
                background: 'var(--white-soft)', border: '1px dashed var(--gray-border)',
                borderRadius: 8, color: 'var(--gray)'
              }}>
                <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>
                  يمكن تحديد موقع المحل من لوحة تحكم الأدمن (الإعدادات).
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
