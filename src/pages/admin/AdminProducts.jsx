// src/pages/admin/AdminProducts.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, Search, DollarSign } from 'lucide-react';
import { getAllProductsAdmin, getCategories, addProduct, updateProduct, deleteProduct, clearAllProducts } from '../../db.js';
import { useApp } from '../../context/AppContext.jsx';
import ProductModal from './ProductModal.jsx';

export default function AdminProducts() {
  const { addToast } = useApp();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const loadData = () => {
    try {
      const p = getAllProductsAdmin();
      setProducts(p);
      const c = getCategories();
      setCategories(c);
    } catch (e) {
      console.error('Failed to load products/categories in admin:', e);
    }
  };

  useEffect(() => {
    loadData();
    const handleStoreChange = () => loadData();
    window.addEventListener('walid_shop_store_change', handleStoreChange);
    return () => window.removeEventListener('walid_shop_store_change', handleStoreChange);
  }, []);

  const handleSaveProduct = (formData) => {
    try {
      if (editingProduct) {
        updateProduct(editingProduct.id, formData);
        addToast('Produit mis à jour avec succès!', 'success');
      } else {
        addProduct(formData);
        addToast('Produit ajouté avec succès!', 'success');
      }
      setModalOpen(false);
      setEditingProduct(null);
      loadData();
    } catch (err) {
      console.error('Error saving product:', err);
      addToast('Erreur lors de l\'enregistrement', 'error');
    }
  };

  const handleDeleteProduct = (id, name) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement "${name}" ?\nهل أنت متأكد من حذف هذا المنتج نهائياً؟`)) {
      try {
        deleteProduct(id);
        // Immediately filter from state for instant responsiveness
        setProducts(prev => prev.filter(p => Number(p.id) !== Number(id)));
        addToast(`Produit "${name}" supprimé définitivement!`, 'success');
        // Also reload from db to be 100% sure
        setTimeout(loadData, 50);
      } catch (err) {
        console.error('Error deleting product:', err);
        addToast('Erreur lors de la suppression', 'error');
      }
    }
  };

  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || Number(p.category_id) === Number(categoryFilter);
    return matchSearch && matchCat;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="admin-page-title" style={{ margin: 0 }}>Gestion des Produits</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--gray)' }}>
            Total: {products.length} produits ({products.filter(p => p.active !== 0).length} actifs)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {products.length > 0 && (
            <button
              className="btn btn-outline btn-sm"
              style={{ color: '#dc2626', borderColor: '#fca5a5' }}
              onClick={() => {
                if (window.confirm('Supprimer TOUS les produits ?\nهل أنت متأكد من حذف كافة المنتجات؟')) {
                  clearAllProducts();
                  setProducts([]);
                  addToast('Tous les produits ont été supprimés!', 'success');
                }
              }}
              title="Supprimer tous les produits du magasin"
            >
              <Trash2 size={14} /> Supprimer tout
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={() => { setEditingProduct(null); setModalOpen(true); }}
            id="admin-add-product-btn"
          >
            <Plus size={16} /> Ajouter un Produit
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-light)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Rechercher un produit..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="admin-search-products"
            />
          </div>

          <select
            className="form-select"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            id="admin-filter-category"
          >
            <option value="">Toutes les catégories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="admin-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Catégorie</th>
                <th>Prix de Vente</th>
                <th>Prix d'Achat</th>
                <th>Marge / الربح</th>
                <th>Tailles & Couleurs</th>
                <th>Stock</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: 'var(--gray-light)', padding: 40 }}>
                    <Package size={40} style={{ opacity: 0.4, margin: '0 auto 10px', display: 'block' }} />
                    Aucun produit trouvé
                  </td>
                </tr>
              ) : filtered.map(p => {
                const profit = p.price - (p.cost_price || 0);
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img
                          src={p.images?.[0] || 'https://placehold.co/60x60?text=No+Img'}
                          alt={p.name}
                          style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--gray-border)', flexShrink: 0 }}
                        />
                        <div>
                          <div style={{ fontWeight: 700 }}>{p.name}</div>
                          {p.badge && <span className="product-badge" style={{ fontSize: 10, padding: '2px 6px' }}>{p.badge}</span>}
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontSize: 13, color: 'var(--gray)' }}>{p.category_name || '—'}</span></td>
                    <td>
                      <strong style={{ fontSize: 14 }}>{p.price?.toLocaleString()} DZD</strong>
                      {p.old_price && (
                        <div style={{ fontSize: 11, color: 'var(--gray-light)', textDecoration: 'line-through' }}>
                          {p.old_price?.toLocaleString()} DZD
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: p.cost_price ? '#059669' : 'var(--gray-light)', fontWeight: 600 }}>
                        {p.cost_price ? `${p.cost_price?.toLocaleString()} DZD` : '—'}
                      </span>
                    </td>
                    <td>
                      {p.cost_price ? (
                        <span style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: profit >= 0 ? '#059669' : '#dc2626',
                          background: profit >= 0 ? '#ecfdf5' : '#fef2f2',
                          padding: '3px 8px',
                          borderRadius: 4
                        }}>
                          {profit >= 0 ? `+${profit.toLocaleString()}` : profit.toLocaleString()} DZD
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--gray-light)' }}>غير محدد</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {p.sizes?.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            {p.sizes.slice(0, 4).map(s => (
                              <span key={s} style={{ fontSize: 10, background: 'var(--white-warm)', border: '1px solid var(--gray-border)', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>
                                {s}
                              </span>
                            ))}
                            {p.sizes.length > 4 && <span style={{ fontSize: 10, color: 'var(--gray)' }}>+{p.sizes.length - 4}</span>}
                          </div>
                        )}
                        {p.colors?.length > 0 && (
                          <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                            {p.colors.slice(0, 5).map(c => (
                              <span key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c, border: '1px solid rgba(0,0,0,0.2)' }} />
                            ))}
                            {p.colors.length > 5 && <span style={{ fontSize: 10, color: 'var(--gray)' }}>+{p.colors.length - 5}</span>}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: p.stock > 10 ? 'var(--black)' : p.stock > 0 ? '#d97706' : '#dc2626'
                      }}>
                        {p.stock}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 12,
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontWeight: 600,
                        background: p.active !== 0 ? '#ecfdf5' : '#f3f4f6',
                        color: p.active !== 0 ? '#059669' : '#6b7280'
                      }}>
                        {p.active !== 0 ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => { setEditingProduct(p); setModalOpen(true); }}
                          title="Modifier"
                          id={`edit-product-${p.id}`}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          title="Supprimer définitivement"
                          id={`delete-product-${p.id}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onSave={handleSaveProduct}
          onClose={() => { setModalOpen(false); setEditingProduct(null); }}
        />
      )}
    </div>
  );
}
