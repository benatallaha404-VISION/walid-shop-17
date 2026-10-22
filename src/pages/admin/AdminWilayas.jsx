// src/pages/admin/AdminWilayas.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Search, RotateCcw, Save, Check } from 'lucide-react';
import { getWilayas, addWilaya, updateWilaya, deleteWilaya, resetDefaultWilayas } from '../../db.js';
import { useApp } from '../../context/AppContext.jsx';

export default function AdminWilayas() {
  const { addToast } = useApp();
  const [wilayas, setWilayas] = useState([]);
  const [search, setSearch] = useState('');

  // Add state
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState(500);

  // Edit inline state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', delivery_price: 0, active: 1 });

  const loadWilayas = () => {
    try {
      setWilayas(getWilayas());
    } catch (e) {
      console.error('Failed to load wilayas:', e);
    }
  };

  useEffect(() => {
    loadWilayas();
    const handleStoreChange = () => loadWilayas();
    window.addEventListener('walid_shop_store_change', handleStoreChange);
    return () => window.removeEventListener('walid_shop_store_change', handleStoreChange);
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    const cleanName = newName.trim();
    if (!cleanName) return addToast('Veuillez entrer le nom de la wilaya', 'error');

    try {
      addWilaya(cleanName, parseFloat(newPrice) || 0, 1);
      setNewName('');
      setNewPrice(500);
      loadWilayas();
      addToast(`Wilaya "${cleanName}" ajoutée avec succès!`, 'success');
    } catch (err) {
      console.error('Error adding wilaya:', err);
      addToast('Erreur lors de l\'ajout', 'error');
    }
  };

  const startEdit = (w) => {
    setEditingId(w.id);
    setEditForm({ name: w.name, delivery_price: w.delivery_price, active: w.active });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', delivery_price: 0, active: 1 });
  };

  const saveEdit = (id) => {
    if (!editForm.name.trim()) return addToast('Le nom ne peut pas être vide', 'error');
    try {
      updateWilaya(id, {
        name: editForm.name.trim(),
        delivery_price: parseFloat(editForm.delivery_price) || 0,
        active: editForm.active
      });
      setEditingId(null);
      loadWilayas();
      addToast('Wilaya mise à jour avec succès!', 'success');
    } catch (err) {
      console.error('Error updating wilaya:', err);
      addToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Supprimer la wilaya "${name}" ?\nهل أنت متأكد من حذف هذه الولاية؟`)) {
      try {
        deleteWilaya(id);
        setWilayas(prev => prev.filter(w => w.id !== id));
        addToast(`Wilaya "${name}" supprimée!`, 'success');
        setTimeout(loadWilayas, 50);
      } catch (err) {
        console.error('Error deleting wilaya:', err);
        addToast('Erreur lors de la suppression', 'error');
      }
    }
  };

  const handleToggleActive = (id, currentActive) => {
    try {
      updateWilaya(id, { active: currentActive === 1 ? 0 : 1 });
      setWilayas(prev => prev.map(w => w.id === id ? { ...w, active: currentActive === 1 ? 0 : 1 } : w));
      addToast('Statut mis à jour', 'info');
    } catch (err) {
      console.error('Error toggling active:', err);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Voulez-vous réinitialiser la liste complète avec les 58 wilayas d\'Algérie par défaut ?\nهل تريد استرجاع قائمة الـ 58 ولاية الافتراضية؟')) {
      try {
        resetDefaultWilayas();
        loadWilayas();
        addToast('Liste des 58 wilayas restaurée!', 'success');
      } catch (err) {
        console.error('Error resetting wilayas:', err);
      }
    }
  };

  const filtered = wilayas.filter(w =>
    !search || w.name?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = wilayas.filter(w => w.active === 1).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="admin-page-title" style={{ margin: 0 }}>Gestion des Wilayas & Prix de Livraison</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--gray)' }}>
            تحكم كامل في الولايات: يمكنك إضافة أي ولاية، تعديل اسمها وسعر التوصيل، حذف أي ولاية، أو التحكم في عدد الولايات كما تريد ({activeCount} مفعلة من أصل {wilayas.length}).
          </p>
        </div>

        <button
          className="btn btn-outline btn-sm"
          onClick={handleResetDefaults}
          title="Restaurer les 58 wilayas par défaut"
        >
          <RotateCcw size={14} /> Réinitialiser 58 Wilayas
        </button>
      </div>

      {/* Add New Wilaya Card */}
      <div className="admin-card" style={{ marginBottom: 24, padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} style={{ color: 'var(--gold)' }} />
          Ajouter une nouvelle wilaya (إضافة ولاية جديدة)
        </h3>

        <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: 12, fontWeight: 700 }}>Nom de la Wilaya (اسم الولاية) *</label>
            <input
              className="form-input"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Ex: Alger, Oran, Tamanrasset..."
              required
              id="new-wilaya-name"
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: 12, fontWeight: 700 }}>Prix de livraison DZD (سعر التوصيل) *</label>
            <input
              className="form-input"
              type="number"
              value={newPrice}
              onChange={e => setNewPrice(e.target.value)}
              placeholder="Ex: 500"
              required
              id="new-wilaya-price"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ height: 42 }}
            id="add-wilaya-submit-btn"
          >
            <Plus size={16} /> Ajouter cette Wilaya
          </button>
        </form>
      </div>

      {/* Search Bar */}
      <div className="admin-card" style={{ marginBottom: 20, padding: 14 }}>
        <div style={{ position: 'relative', maxWidth: 360 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-light)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 36 }}
            placeholder="Filtrer une wilaya par nom..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="search-wilayas-input"
          />
        </div>
      </div>

      {/* Wilayas Table */}
      <div className="admin-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>Nom de la Wilaya (اسم الولاية)</th>
                <th>Prix Livraison (سعر التوصيل)</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-light)', padding: 40 }}>
                    <MapPin size={40} style={{ opacity: 0.4, margin: '0 auto 10px', display: 'block' }} />
                    Aucune wilaya trouvée
                  </td>
                </tr>
              ) : filtered.map((w, index) => {
                const isEditing = editingId === w.id;

                return (
                  <tr key={w.id}>
                    <td style={{ color: 'var(--gray-light)', fontSize: 12 }}>{index + 1}</td>
                    <td>
                      {isEditing ? (
                        <input
                          className="form-input"
                          style={{ padding: '6px 10px', fontSize: 13, maxWidth: 220 }}
                          value={editForm.name}
                          onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <MapPin size={14} style={{ color: 'var(--gold-dark)' }} />
                          <strong style={{ fontSize: 14 }}>{w.name}</strong>
                        </div>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            className="form-input"
                            type="number"
                            style={{ padding: '6px 10px', fontSize: 13, maxWidth: 120 }}
                            value={editForm.delivery_price}
                            onChange={e => setEditForm(prev => ({ ...prev, delivery_price: e.target.value }))}
                          />
                          <span style={{ fontSize: 12 }}>DZD</span>
                        </div>
                      ) : (
                        <strong style={{ fontSize: 14, color: 'var(--black)' }}>
                          {w.delivery_price?.toLocaleString()} DZD
                        </strong>
                      )}
                    </td>
                    <td>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isEditing ? editForm.active === 1 : w.active === 1}
                          onChange={e => {
                            if (isEditing) {
                              setEditForm(prev => ({ ...prev, active: e.target.checked ? 1 : 0 }));
                            } else {
                              handleToggleActive(w.id, w.active);
                            }
                          }}
                          style={{ width: 16, height: 16 }}
                        />
                        <span style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: (isEditing ? editForm.active === 1 : w.active === 1) ? '#059669' : '#9ca3af'
                        }}>
                          {(isEditing ? editForm.active === 1 : w.active === 1) ? 'Active (مفعلة)' : 'Désactivée (معطلة)'}
                        </span>
                      </label>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {isEditing ? (
                          <>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => saveEdit(w.id)}
                              title="Enregistrer les modifications"
                            >
                              <Save size={13} /> Sauvegarder
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={cancelEdit}
                            >
                              Annuler
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => startEdit(w)}
                              title="Modifier nom et prix"
                            >
                              <Edit2 size={13} /> Modifier
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(w.id, w.name)}
                              title="Supprimer la wilaya"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
