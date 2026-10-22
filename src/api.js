// src/api.js - Frontend API client — replaces db.js for all data operations
// All data is now fetched from the Express+SQLite backend (shared across ALL devices)

const BASE = import.meta.env.VITE_API_URL || '';

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}/api${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

const get = (path, params) => {
  if (!params) return request('GET', path);
  const cleanParams = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '' && v !== 'null') {
      cleanParams[k] = v;
    }
  }
  const qs = Object.keys(cleanParams).length ? `?${new URLSearchParams(cleanParams)}` : '';
  return request('GET', `${path}${qs}`);
};
const post   = (path, body) => request('POST', path, body);
const put    = (path, body) => request('PUT', path, body);
const del    = (path)       => request('DELETE', path);

// ─── Settings ─────────────────────────────────────────────────────────────────
export const getAllSettings = () => get('/settings');
export const saveSettings  = (data) => post('/settings', data);
export const getSetting    = async (key) => { const s = await getAllSettings(); return s[key]; };
export const setSetting    = (key, value) => post('/settings', { [key]: value });

// ─── Categories ───────────────────────────────────────────────────────────────
export const getCategories     = (activeOnly = false) => get('/categories', activeOnly ? { active: '1' } : {});
export const addCategory       = (name, slug) => post('/categories', { name, slug });
export const updateCategory    = (id, name, slug, active) => put(`/categories/${id}`, { name, slug, active });
export const deleteCategory    = (id) => del(`/categories/${id}`);

// ─── Wilayas ──────────────────────────────────────────────────────────────────
export const getWilayas        = (activeOnly = false) => get('/wilayas', activeOnly ? { active: '1' } : {});
export const addWilaya         = (name, delivery_price, active = 1) => post('/wilayas', { name, delivery_price, active });
export const updateWilaya      = (id, data) => put(`/wilayas/${id}`, data);
export const deleteWilaya      = (id) => del(`/wilayas/${id}`);
export const resetDefaultWilayas = () => post('/wilayas/reset', {});

// ─── Products ─────────────────────────────────────────────────────────────────
export const getProducts         = (opts = {}) => get('/products', opts);
export const getAllProductsAdmin  = ()          => get('/products', { admin: '1' });
export const getProductById      = (id)        => get(`/products/${id}`);
export const addProduct          = (data)      => post('/products', data);
export const updateProduct       = (id, data)  => put(`/products/${id}`, data);
export const deleteProduct       = (id)        => del(`/products/${id}`);
export const clearAllProducts    = ()          => del('/products');

// ─── Orders ───────────────────────────────────────────────────────────────────
export const getOrders           = ()          => get('/orders');
export const createOrder         = (data)      => post('/orders', data);
export const updateOrderStatus   = (id, status) => put(`/orders/${id}/status`, { status });
export const deleteOrder         = (id)        => del(`/orders/${id}`);

// ─── Stats ────────────────────────────────────────────────────────────────────
export const getStats            = ()          => get('/stats');

// ─── Image compression (stays client-side) ────────────────────────────────────
export function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.82) {
  return new Promise((resolve) => {
    if (!file || !file.type?.startsWith('image/')) { resolve(''); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxWidth || h > maxHeight) {
          if (w > h) { h = Math.round(h * maxWidth / w); w = maxWidth; }
          else       { w = Math.round(w * maxHeight / h); h = maxHeight; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        try {
          const webp = canvas.toDataURL('image/webp', quality);
          if (webp.startsWith('data:image/webp')) return resolve(webp);
        } catch (_) {}
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

// ─── DB backup (export JSON) ──────────────────────────────────────────────────
export async function exportDB() {
  const [settings, categories, wilayas, products, orders] = await Promise.all([
    getAllSettings(), getCategories(), getWilayas(), getAllProductsAdmin(), getOrders()
  ]);
  const data = { settings, categories, wilayas, products, orders };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `walid-shop-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importDB(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.settings) await saveSettings(data.settings);
        // categories
        if (Array.isArray(data.categories)) {
          for (const c of data.categories) await addCategory(c.name, c.slug).catch(() => {});
        }
        // wilayas
        if (Array.isArray(data.wilayas)) {
          for (const w of data.wilayas) await addWilaya(w.name, w.delivery_price, w.active).catch(() => {});
        }
        // products
        if (Array.isArray(data.products)) {
          for (const p of data.products) await addProduct(p).catch(() => {});
        }
        resolve();
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsText(file);
  });
}

// ─── Legacy compat: initDB (no-op — server handles init) ─────────────────────
export async function initDB() { return true; }

// Default settings export (for components that need it synchronously)
export const defaultSettings = {
  store_name: 'Walid Shop', store_email: '', store_phone: '',
  store_address: '', store_whatsapp: '', store_instagram: '', store_facebook: '',
  store_map_embed: '', hero_title: 'Walid Shop',
  hero_subtitle: 'متجركم المفضل للأناقة والموضة الرجالية',
  hero_tag: 'Walid Shop Collection', hero_image: '',
  emailjs_service_id: '', emailjs_template_id: '', emailjs_public_key: '',
  admin_password: 'WALID123',
};
