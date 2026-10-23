// pages/ProductDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Package } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { getProductById } from '../api.js';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart } = useApp();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedImg, setSelectedImg] = useState(0);
  const [customColorImg, setCustomColorImg] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const p = await getProductById(id);
      if (p) {
        setProduct(p);
        setSelectedSize(p.sizes?.[0] || '');
        const initialColor = p.colors?.[0] || '';
        setSelectedColor(initialColor);
        if (p.color_images && p.color_images[initialColor]) {
          const idx = p.images?.indexOf(p.color_images[initialColor]);
          if (idx !== -1 && idx !== undefined) setSelectedImg(idx);
          else setCustomColorImg(p.color_images[initialColor]);
        }
      }
    } catch (e) {
      console.error('Error fetching product:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [id]);

  const handleColorClick = (color, index) => {
    setSelectedColor(color);
    if (product?.color_images && product.color_images[color]) {
      const targetUrl = product.color_images[color];
      const idx = product.images?.indexOf(targetUrl);
      if (idx !== -1 && idx !== undefined) {
        setSelectedImg(idx);
        setCustomColorImg(null);
      } else {
        setCustomColorImg(targetUrl);
      }
    } else if (product?.images && product.images[index]) {
      setSelectedImg(index);
      setCustomColorImg(null);
    }
  };

  if (loading) return <div style={{ marginTop: 80 }}><div className="spinner" /></div>;
  if (!product) return (
    <div className="product-detail">
      <div className="container">
        <div className="empty-state">
          <Package size={60} />
          <h3>Produit introuvable</h3>
          <button className="btn btn-primary mt-4" onClick={() => navigate('/')}>Retour au Shop</button>
        </div>
      </div>
    </div>
  );

  const handleAddToCart = () => {
    if (!selectedSize && product.sizes?.length > 0) {
      alert('Veuillez choisir une taille');
      return;
    }
    const cartProduct = {
      ...product,
      images: customColorImg ? [customColorImg, ...(product.images || [])] : product.images
    };
    addToCart(cartProduct, selectedSize, selectedColor, qty);
  };

  const currentMainImage = customColorImg || product.images?.[selectedImg] || 'https://placehold.co/600x800?text=No+Image';

  return (
    <main className="product-detail">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb" style={{ marginBottom: 28 }}>
          <Link to="/">Shop</Link>
          <span>/</span>
          {product.category_name && <><span>{product.category_name}</span><span>/</span></>}
          <span style={{ color: 'var(--black)' }}>{product.name}</span>
        </div>

        <div className="product-detail-grid">
          {/* Gallery */}
          <div className="product-gallery">
            <img
              src={currentMainImage}
              alt={product.name}
              className="product-main-img"
              id="product-main-image"
              key={currentMainImage}
              style={{ transition: 'opacity 0.25s ease' }}
            />
            {product.images?.length > 1 && (
              <div className="product-thumbs">
                {product.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`${product.name} ${i + 1}`}
                    className={`product-thumb ${!customColorImg && selectedImg === i ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedImg(i);
                      setCustomColorImg(null);
                    }}
                    id={`product-thumb-${i}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="product-detail-info">
            {product.badge && <span className="product-badge" style={{ marginBottom: 12, display: 'inline-block' }}>{product.badge}</span>}
            <h1>{product.name}</h1>
            <div className="product-detail-price">
              {product.price?.toLocaleString()} DZD
              {product.old_price && (
                <span className="product-old-price" style={{ marginLeft: 12, fontSize: 18 }}>
                  {product.old_price?.toLocaleString()} DZD
                </span>
              )}
            </div>

            {product.description && (
              <p style={{ color: 'var(--gray)', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
                {product.description}
              </p>
            )}

            {/* Colors */}
            {product.colors?.length > 0 && (
              <div className="color-selector" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <h4 style={{ margin: 0 }}>Couleur:</h4>
                  <span style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 600 }}>{selectedColor}</span>
                </div>
                <div className="color-options">
                  {product.colors.map((c, i) => (
                    <button
                      key={i}
                      className={`color-option ${selectedColor === c ? 'active' : ''}`}
                      style={{ background: c }}
                      onClick={() => handleColorClick(c, i)}
                      aria-label={`Couleur ${c}`}
                      title={c}
                      id={`color-option-${i}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes?.length > 0 && (
              <div className="size-selector" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <h4 style={{ margin: 0 }}>Taille:</h4>
                  {selectedSize && <span style={{ fontSize: 13, color: 'var(--gold-dark)', fontWeight: 700 }}>{selectedSize}</span>}
                </div>
                <div className="sizes">
                  {product.sizes.map((s, i) => (
                    <button
                      key={i}
                      className={`size-btn ${selectedSize === s ? 'active' : ''}`}
                      onClick={() => setSelectedSize(s)}
                      id={`size-btn-${i}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Qty */}
            <div className="qty-selector">
              <label>Quantité</label>
              <div className="qty-control">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Diminuer">−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(q => q + 1)} aria-label="Augmenter">+</button>
              </div>
            </div>

            {/* Stock */}
            {product.stock !== undefined && (
              <p style={{ fontSize: 13, color: product.stock > 0 ? '#16a34a' : '#dc2626', marginBottom: 16 }}>
                {product.stock > 0 ? `✓ En stock (${product.stock} disponibles)` : '✗ Rupture de stock'}
              </p>
            )}

            {/* CTA */}
            <button
              className="btn btn-primary add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              id="add-to-cart-btn"
            >
              <ShoppingBag size={18} />
              Ajouter au panier
            </button>

            <button
              className="btn btn-outline add-to-cart-btn"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => { handleAddToCart(); navigate('/checkout'); }}
              id="buy-now-btn"
              disabled={product.stock === 0}
            >
              Commander maintenant
            </button>

            <button
              className="btn btn-ghost"
              style={{ marginTop: 8 }}
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={15} />
              Retour
            </button>
          </div>
        </div>

        {/* Mobile Sticky Purchase Bar */}
        <div className="product-mobile-sticky-bar">
          <div className="mobile-bar-price">
            <span className="mobile-bar-curr-price">{product.price?.toLocaleString()} DZD</span>
            {product.old_price && (
              <span className="mobile-bar-old-price">{product.old_price?.toLocaleString()} DZD</span>
            )}
          </div>
          <div className="mobile-bar-actions">
            <button
              className="btn btn-outline mobile-bar-cart-btn"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              id="mobile-sticky-add-cart"
              title="Ajouter au panier"
            >
              <ShoppingBag size={17} />
            </button>
            <button
              className="btn btn-primary mobile-bar-buy-btn"
              onClick={() => { handleAddToCart(); navigate('/checkout'); }}
              disabled={product.stock === 0}
              id="mobile-sticky-buy-now"
            >
              Commander الآن
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
