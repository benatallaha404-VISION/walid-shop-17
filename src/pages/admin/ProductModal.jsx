// src/pages/admin/ProductModal.jsx
import React, { useState, useRef } from 'react';
import { X, Plus, Trash2, Image, Link as LinkIcon, DollarSign, Check } from 'lucide-react';

const POPULAR_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '36', '38', '40', '42', '44', 'Unique'];
const PRESET_COLORS = [
  '#000000', '#ffffff', '#1f2937', '#4b5563', '#9ca3af',
  '#b91c1c', '#ea580c', '#d97706', '#15803d', '#1d4ed8',
  '#4338ca', '#7e22ce', '#be185d', '#d4af37', '#78350f'
];

export default function ProductModal({ product, categories, onSave, onClose }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category_id: product?.category_id || (categories[0]?.id || ''),
    price: product?.price || '',
    old_price: product?.old_price || '',
    cost_price: product?.cost_price || '',
    stock: product?.stock !== undefined ? product.stock : 20,
    badge: product?.badge || '',
    active: product?.active !== 0,
    images: Array.isArray(product?.images) ? product.images : [],
    sizes: Array.isArray(product?.sizes) ? product.sizes : (typeof product?.sizes === 'string' ? product.sizes.split(',').map(s => s.trim()).filter(Boolean) : []),
    colors: Array.isArray(product?.colors) ? product.colors : [],
    color_images: product?.color_images && typeof product.color_images === 'object' ? { ...product.color_images } : {},
  });

  const [customSize, setCustomSize] = useState('');
  const [newColor, setNewColor] = useState('#000000');
  const [imgUrl, setImgUrl] = useState('');
  const [activeColorForImage, setActiveColorForImage] = useState(null);
  const fileInputRef = useRef();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Sizes management (like colors selection)
  const toggleSize = (sz) => {
    setForm(prev => {
      const exists = prev.sizes.includes(sz);
      const newSizes = exists ? prev.sizes.filter(s => s !== sz) : [...prev.sizes, sz];
      return { ...prev, sizes: newSizes };
    });
  };

  const addCustomSize = (e) => {
    e?.preventDefault();
    const clean = customSize.trim().toUpperCase();
    if (clean && !form.sizes.includes(clean)) {
      setForm(prev => ({ ...prev, sizes: [...prev.sizes, clean] }));
      setCustomSize('');
    }
  };

  // Colors management
  const addColor = (c) => {
    if (!form.colors.includes(c)) {
      setForm(prev => ({ ...prev, colors: [...prev.colors, c] }));
    }
  };

  const removeColor = (c) => {
    setForm(prev => {
      const newColors = prev.colors.filter(col => col !== c);
      const newColorImages = { ...prev.color_images };
      delete newColorImages[c];
      return { ...prev, colors: newColors, color_images: newColorImages };
    });
    if (activeColorForImage === c) setActiveColorForImage(null);
  };

  // Images management
  const addImage = () => {
    const clean = imgUrl.trim();
    if (clean && !form.images.includes(clean)) {
      setForm(prev => ({ ...prev, images: [...prev.images, clean] }));
      setImgUrl('');
    }
  };

  const removeImage = (index) => {
    const removedUrl = form.images[index];
    setForm(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      const newColorImages = { ...prev.color_images };
      Object.entries(newColorImages).forEach(([col, u]) => {
        if (u === removedUrl) delete newColorImages[col];
      });
      return { ...prev, images: newImages, color_images: newColorImages };
    });
  };

  // Upload images from device
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        setForm(prev => {
          if (prev.images.includes(dataUrl)) return prev;
          return { ...prev, images: [...prev.images, dataUrl] };
        });
      };
      reader.readAsDataURL(file);
    });
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Link image to color
  const assignImageToColor = (color, url) => {
    setForm(prev => ({
      ...prev,
      color_images: {
        ...prev.color_images,
        [color]: url
      }
    }));
    setActiveColorForImage(null);
  };

  const removeColorImage = (color) => {
    setForm(prev => {
      const next = { ...prev.color_images };
      delete next[color];
      return { ...prev, color_images: next };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('Veuillez entrer le nom du produit');
    if (!form.price) return alert('Veuillez entrer le prix de vente');

    onSave({
      ...form,
      price: parseFloat(form.price) || 0,
      old_price: form.old_price ? parseFloat(form.old_price) : null,
      cost_price: form.cost_price ? parseFloat(form.cost_price) : 0,
      stock: parseInt(form.stock) || 0,
      category_id: form.category_id ? parseInt(form.category_id) : null,
    });
  };

  // Profit calculation preview
  const sellingPrice = parseFloat(form.price) || 0;
  const costPrice = parseFloat(form.cost_price) || 0;
  const profitMargin = sellingPrice > 0 ? sellingPrice - costPrice : 0;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 760, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h3>{product ? 'Modifier le Produit' : 'Ajouter un Produit'}</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Main Info */}
          <div className="form-group">
            <label>Nom du Produit *</label>
            <input
              className="form-input"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ex: T-Shirt Premium Coton"
              required
              id="product-form-name"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Catégorie</label>
              <select
                className="form-select"
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                id="product-form-category"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Badge (optionnel)</label>
              <input
                className="form-input"
                name="badge"
                value={form.badge}
                onChange={handleChange}
                placeholder="Ex: NOUVEAU, PROMO, TOP VENTE"
                id="product-form-badge"
              />
            </div>
          </div>

          {/* Pricing Row with Cost Price */}
          <div className="form-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            <div className="form-group">
              <label style={{ fontWeight: 700, color: 'var(--black)' }}>
                Prix de vente (DZD) *
                <span style={{ fontSize: 11, color: 'var(--gray)', display: 'block', fontWeight: 400 }}>سعر البيع للعميل</span>
              </label>
              <input
                className="form-input"
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="Ex: 3500"
                required
                id="product-form-price"
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 700, color: '#059669' }}>
                Prix d'achat / Coût (DZD)
                <span style={{ fontSize: 11, color: 'var(--gray)', display: 'block', fontWeight: 400 }}>سعر الشراء (للإدارة فقط)</span>
              </label>
              <input
                className="form-input"
                type="number"
                name="cost_price"
                value={form.cost_price}
                onChange={handleChange}
                placeholder="Ex: 2000"
                id="product-form-cost-price"
              />
            </div>

            <div className="form-group">
              <label>
                Ancien prix (DZD)
                <span style={{ fontSize: 11, color: 'var(--gray)', display: 'block', fontWeight: 400 }}>السعر قبل الخصم</span>
              </label>
              <input
                className="form-input"
                type="number"
                name="old_price"
                value={form.old_price}
                onChange={handleChange}
                placeholder="Ex: 4500"
                id="product-form-old-price"
              />
            </div>

            <div className="form-group">
              <label>
                Quantité en Stock
                <span style={{ fontSize: 11, color: 'var(--gray)', display: 'block', fontWeight: 400 }}>الكمية المتوفرة</span>
              </label>
              <input
                className="form-input"
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                placeholder="20"
                id="product-form-stock"
              />
            </div>
          </div>

          {/* Profit Preview */}
          {sellingPrice > 0 && costPrice > 0 && (
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 13,
              color: '#065f46'
            }}>
              <span><strong>Marge bénéficiaire (هامش الربح لكل قطعة):</strong></span>
              <span style={{ fontWeight: 800, fontSize: 15 }}>+{profitMargin.toLocaleString()} DZD ({Math.round((profitMargin / sellingPrice) * 100)}%)</span>
            </div>
          )}

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-textarea"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Description détaillée du produit..."
              id="product-form-description"
            />
          </div>

          {/* Sizes Selection (Interactive Chips just like Colors) */}
          <div className="form-group" style={{ background: 'var(--white-warm)', padding: 16, borderRadius: 8, border: '1px solid var(--gray-border)' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>
              Tailles disponibles / المقاسات (اختيار مباشر):
            </label>
            <p style={{ fontSize: 12, color: 'var(--gray)', margin: '0 0 10px 0' }}>
              انقر على أي مقاس لإضافته أو إزالته من المقاسات المتاحة لهذا المنتج:
            </p>

            {/* Popular preset size buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {POPULAR_SIZES.map(sz => {
                const isSelected = form.sizes.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSize(sz)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: isSelected ? '2px solid var(--black)' : '1px solid var(--gray-border)',
                      background: isSelected ? 'var(--black)' : 'var(--white)',
                      color: isSelected ? 'var(--gold)' : 'var(--black)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isSelected && <Check size={13} />}
                    {sz}
                  </button>
                );
              })}
            </div>

            {/* Custom size input */}
            <div style={{ display: 'flex', gap: 8, maxWidth: 280 }}>
              <input
                className="form-input"
                style={{ padding: '6px 10px', fontSize: 13 }}
                value={customSize}
                onChange={e => setCustomSize(e.target.value)}
                placeholder="مقاس مخصص (مثال: 46)..."
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomSize(); } }}
              />
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={addCustomSize}
              >
                <Plus size={14} /> Ajouter
              </button>
            </div>

            {/* Selected sizes preview */}
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--gray)' }}>
              المقاسات المحددة حالياً ({form.sizes.length}): {' '}
              {form.sizes.length > 0 ? (
                <span style={{ fontWeight: 700, color: 'var(--black)' }}>{form.sizes.join(' · ')}</span>
              ) : (
                <span style={{ color: '#ef4444' }}>لم يتم اختيار أي مقاس بعد</span>
              )}
            </div>
          </div>

          {/* Colors Selection & Color Image Mapping */}
          <div className="form-group" style={{ background: 'var(--white-warm)', padding: 16, borderRadius: 8, border: '1px solid var(--gray-border)' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>
              Couleurs / الألوان وربطها بالصور:
            </label>
            <p style={{ fontSize: 12, color: 'var(--gray)', margin: '0 0 10px 0' }}>
              اختر الألوان المتاحة للمنتج، ويمكنك ربط كل لون بصورة مخصصة تتغير تلقائياً عند نقر العميل على اللون في صفحة المنتج:
            </p>

            {/* Color swatches */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => addColor(c)}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: c,
                    border: form.colors.includes(c) ? '3px solid var(--gold)' : '1px solid rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    transform: form.colors.includes(c) ? 'scale(1.15)' : 'none'
                  }}
                  title={c}
                />
              ))}

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                <input
                  type="color"
                  value={newColor}
                  onChange={e => setNewColor(e.target.value)}
                  style={{ width: 34, height: 34, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                />
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => addColor(newColor)}
                >
                  <Plus size={14} /> Ajouter couleur
                </button>
              </div>
            </div>

            {/* List of selected colors and their linked images */}
            {form.colors.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                {form.colors.map(c => {
                  const linkedImg = form.color_images[c];
                  return (
                    <div
                      key={c}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'var(--white)',
                        borderRadius: 6,
                        border: '1px solid var(--gray-border)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: '1px solid rgba(0,0,0,0.2)' }} />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{c}</span>
                        {linkedImg ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: 4 }}>
                            <img src={linkedImg} alt="" style={{ width: 24, height: 24, objectFit: 'cover', borderRadius: 3 }} />
                            <span>صورة مربوطة بهذا اللون</span>
                            <button
                              type="button"
                              onClick={() => removeColorImage(c)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                              title="إلغاء ربط الصورة"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--gray)' }}>
                            (الصورة الافتراضية)
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {form.images.length > 0 && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: 12, padding: '4px 8px' }}
                            onClick={() => setActiveColorForImage(activeColorForImage === c ? null : c)}
                          >
                            <Image size={13} /> {linkedImg ? 'تغيير الصورة' : 'ربط بصورة'}
                          </button>
                        )}
                        <button
                          type="button"
                          className="icon-btn"
                          style={{ color: '#ef4444' }}
                          onClick={() => removeColor(c)}
                          title="حذف هذا اللون"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Image picker for active color */}
            {activeColorForImage && (
              <div style={{ marginTop: 12, padding: 12, background: 'var(--white)', borderRadius: 6, border: '2px dashed var(--gold)' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 700 }}>
                  اختر الصورة التي تظهر عندما يضغط العميل على اللون {activeColorForImage}:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {form.images.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => assignImageToColor(activeColorForImage, img)}
                      style={{
                        cursor: 'pointer',
                        border: form.color_images[activeColorForImage] === img ? '3px solid #059669' : '1px solid var(--gray-border)',
                        borderRadius: 6,
                        overflow: 'hidden',
                        position: 'relative'
                      }}
                    >
                      <img src={img} alt="" style={{ width: 64, height: 64, objectFit: 'cover', display: 'block' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Images Section */}
          <div className="form-group">
            <label style={{ fontWeight: 700 }}>Images du Produit / صور المنتج</label>

            {/* Upload from device */}
            <div
              className="img-upload-area"
              onClick={() => fileInputRef.current?.click()}
              style={{ marginBottom: 12 }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <div style={{ fontSize: 28, marginBottom: 6 }}>📁</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>انقر لرفع صور من جهازك</div>
              <div style={{ fontSize: 12, color: 'var(--gray)' }}>يمكنك اختيار عدة صور دفعة واحدة — PNG, JPG, WebP</div>
            </div>

            {/* Or enter URL */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--gray-light)', flexShrink: 0 }}>أو رابط:</div>
              <input
                className="form-input"
                value={imgUrl}
                onChange={e => setImgUrl(e.target.value)}
                placeholder="https://...  (رابط صورة)"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addImage(); } }}
                id="product-form-img-input"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={addImage}
                id="product-form-add-img-btn"
              >
                <Plus size={14} /> Ajouter
              </button>
            </div>

            {form.images.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {form.images.map((img, i) => (
                  <div key={i} style={{ position: 'relative', width: 72, height: 72, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--gray-border)' }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      style={{
                        position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)',
                        color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active status */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}>
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
                style={{ width: 18, height: 18 }}
              />
              <span>Produit actif (visible sur la boutique) / منتج مفعل يظهر في المتجر</span>
            </label>
          </div>

          <div className="modal-footer" style={{ marginTop: 24 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" id="save-product-modal-btn">
              {product ? 'Mettre à jour' : 'Ajouter le Produit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
