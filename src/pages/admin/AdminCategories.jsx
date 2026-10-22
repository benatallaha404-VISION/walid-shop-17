// src/pages/admin/AdminCategories.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, Save, X } from 'lucide-react';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../../api.js';
import { useApp } from '../../context/AppContext.jsx';

export default function AdminCategories() {
  const { addToast } = useApp();
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState({ name: '', slug: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', slug: '', active: 1 });

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load categories:', e);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCat.name.trim()) return;
    const slug = newCat.slug.trim() || newCat.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    try {
      await addCategory(newCat.name.trim(), slug);
      setNewCat({ name: '', slug: '' });
      await loadCategories();
      addToast('Catégorie ajoutée!', 'success');
    } catch (err) {
      console.error('Error adding category:', err);
      addToast('Erreur lors de l\'ajout', 'error');
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditForm({ name: cat.name, slug: cat.slug, active: cat.active });
  };

  const handleSaveEdit = async (id) => {
    if (!editForm.name.trim()) return;
    try {
      await updateCategory(id, editForm.name.trim(), editForm.slug.trim(), editForm.active);
      setEditingId(null);
      await loadCategories();
      addToast('Catégorie mise à jour!', 'success');
    } catch (err) {
      console.error('Error updating category:', err);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Supprimer la catégorie "${name}" ?`)) {
      try {
        await deleteCategory(id);
        await loadCategories();
        addToast('Catégorie supprimée!', 'success');
      } catch (err) {
        console.error('Error deleting category:', err);
      }
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 className="admin-page-title" style={{ margin: 0 }}>Catégories</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--gray)' }}>
          Gérer les catégories de vêtements et accessoires de la boutique.
        </p>
      </div>

      {/* Add Category Form */}
      <div className="admin-card" style={{ marginBottom: 24, padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} style={{ color: 'var(--gold)' }} />
          Ajouter une nouvelle catégorie
        </h3>
        <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Nom de la catégorie *</label>
            <input
              className="form-input"
              value={newCat.name}
              onChange={e => {
                const name = e.target.value;
                setNewCat({
                  name,
                  slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                });
              }}
              placeholder="Ex: Chemises, Polos..."
              required
              id="new-category-name"
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Slug (identifiant URL)</label>
            <input
              className="form-input"
              value={newCat.slug}
              onChange={e => setNewCat(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="chemises"
              id="new-category-slug"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ height: 42 }}>
            <Plus size={16} /> Ajouter Catégorie
          </button>
        </form>
      </div>

      {/* Categories Table */}
      <div className="admin-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>Nom</th>
                <th>Slug</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, i) => {
                const isEditing = editingId === cat.id;

                return (
                  <tr key={cat.id}>
                    <td style={{ color: 'var(--gray-light)', fontSize: 12 }}>{i + 1}</td>
                    <td>
                      {isEditing ? (
                        <input
                          className="form-input"
                          style={{ padding: '6px 10px', fontSize: 13 }}
                          value={editForm.name}
                          onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Tag size={14} style={{ color: 'var(--gold-dark)' }} />
                          <strong>{cat.name}</strong>
                        </div>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          className="form-input"
                          style={{ padding: '6px 10px', fontSize: 13 }}
                          value={editForm.slug}
                          onChange={e => setEditForm(prev => ({ ...prev, slug: e.target.value }))}
                        />
                      ) : (
                        <code style={{ fontSize: 12, background: 'var(--white-warm)', padding: '2px 6px', borderRadius: 4 }}>
                          {cat.slug}
                        </code>
                      )}
                    </td>
                    <td>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isEditing ? editForm.active === 1 : cat.active === 1}
                          onChange={e => {
                            if (isEditing) {
                              setEditForm(prev => ({ ...prev, active: e.target.checked ? 1 : 0 }));
                            } else {
                              updateCategory(cat.id, cat.name, cat.slug, e.target.checked ? 1 : 0);
                              loadCategories();
                            }
                          }}
                        />
                        <span style={{ fontSize: 12, fontWeight: 600 }}>
                          {(isEditing ? editForm.active === 1 : cat.active === 1) ? 'Active' : 'Inactif'}
                        </span>
                      </label>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {isEditing ? (
                          <>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleSaveEdit(cat.id)}
                            >
                              <Save size={13} /> Sauvegarder
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setEditingId(null)}
                            >
                              Annuler
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => startEdit(cat)}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(cat.id, cat.name)}
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
