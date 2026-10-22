// src/db.js - High-Performance, Ultra-Reliable IndexedDB & LocalStorage Database
// Zero flicker, instant synchronous reads, persistent storage with image support

const IDB_NAME = 'walid_shop_db_v2';
const IDB_STORE = 'app_data';
const LOCAL_STORE_KEY = 'walid_shop_store_v2';

export const defaultSettings = {
  store_name: 'Walid Shop',
  store_email: '',
  store_phone: '',
  store_address: '',
  store_whatsapp: '',
  store_instagram: '',
  store_facebook: '',
  store_map_embed: '',
  hero_title: 'Walid Shop',
  hero_subtitle: 'متجركم المفضل للأناقة والموضة الرجالية',
  hero_tag: 'Walid Shop Collection',
  hero_image: '',
  emailjs_service_id: '',
  emailjs_template_id: '',
  emailjs_public_key: '',
  admin_password: 'WALID123',
};

export const defaultCategories = [
  { id: 1, name: 'T-Shirts', slug: 't-shirts', active: 1 },
  { id: 2, name: 'Pantalons', slug: 'pantalons', active: 1 },
  { id: 3, name: 'Vestes', slug: 'vestes', active: 1 },
  { id: 4, name: 'Chaussures', slug: 'chaussures', active: 1 },
  { id: 5, name: 'Accessoires', slug: 'accessoires', active: 1 },
  { id: 6, name: 'Hoodies', slug: 'hoodies', active: 1 },
];

export const defaultWilayasList = [
  'Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar',
  'Blida','Bouira','Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger',
  'Djelfa','Jijel','Sétif','Saïda','Skikda','Sidi Bel Abbès','Annaba','Guelma',
  'Constantine','Médéa','Mostaganem','M\'Sila','Mascara','Ouargla','Oran','El Bayadh',
  'Illizi','Bordj Bou Arréridj','Boumerdès','El Tarf','Tindouf','Tissemsilt','El Oued',
  'Khenchela','Souk Ahras','Tipaza','Mila','Aïn Defla','Naâma','Aïn Témouchent',
  'Ghardaïa','Relizane','Timimoun','Bordj Badji Mokhtar','Ouled Djellal','Béni Abbès',
  'In Salah','In Guezzam','Touggourt','Djanet','El M\'Ghair','El Meniaa'
];

function buildDefaultWilayas() {
  return defaultWilayasList.map((name, i) => ({
    id: i + 1,
    name,
    delivery_price: name === 'Alger' ? 400 : (name === 'Oran' || name === 'Constantine' || name === 'Blida') ? 500 : 700,
    active: 1
  }));
}

// In-Memory synchronous cache
let store = {
  settings: { ...defaultSettings },
  categories: [...defaultCategories],
  wilayas: buildDefaultWilayas(),
  products: [],
  orders: []
};

// Synchronously load from LocalStorage on module import for 0ms immediate data availability
try {
  const localRaw = localStorage.getItem(LOCAL_STORE_KEY) || localStorage.getItem('walid_shop_fallback_store');
  if (localRaw) {
    const parsed = JSON.parse(localRaw);
    if (parsed && typeof parsed === 'object') {
      store = {
        settings: { ...defaultSettings, ...(parsed.settings || {}) },
        categories: Array.isArray(parsed.categories) && parsed.categories.length ? parsed.categories : [...defaultCategories],
        wilayas: Array.isArray(parsed.wilayas) && parsed.wilayas.length ? parsed.wilayas : buildDefaultWilayas(),
        products: Array.isArray(parsed.products) ? parsed.products : [],
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      };
    }
  }
} catch (e) {
  console.warn('Initial store load warning:', e);
}

// IndexedDB Helper (Promise-based, works everywhere, unlimited storage)
function openIDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not available'));
    }
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadFromIndexedDB() {
  try {
    const idb = await openIDB();
    return new Promise((resolve) => {
      const tx = idb.transaction(IDB_STORE, 'readonly');
      const os = tx.objectStore(IDB_STORE);
      const req = os.get('main_state');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('IndexedDB load warning:', err);
    return null;
  }
}

async function saveToIndexedDB(state) {
  try {
    const idb = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE, 'readwrite');
      const os = tx.objectStore(IDB_STORE);
      const req = os.put(state, 'main_state');
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB save warning:', err);
  }
}

// Persist function: updates IndexedDB (unlimited) and mirrors to LocalStorage safely
function persist() {
  // 1. Asynchronously persist to IndexedDB (safe for huge images)
  saveToIndexedDB(store);

  // 2. Mirror to LocalStorage for instant 0ms first-render on reload
  try {
    localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(store));
  } catch (err) {
    // If quota exceeded due to large images, store without images in localStorage
    // while IndexedDB keeps full images perfectly safe!
    try {
      const lightStore = {
        ...store,
        products: store.products.map(p => ({
          ...p,
          images: (p.images || []).map(img => img.length > 200000 ? '' : img)
        }))
      };
      localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(lightStore));
    } catch (_) {
      console.warn('LocalStorage quota limit reached; IndexedDB is active.');
    }
  }

  // Notify active listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('walid_shop_store_change', { detail: store }));
  }
}

// Initialize database
let dbInitialized = false;
export async function initDB() {
  if (dbInitialized) return store;

  try {
    const idbData = await loadFromIndexedDB();
    if (idbData && typeof idbData === 'object') {
      store = {
        settings: { ...defaultSettings, ...(idbData.settings || {}) },
        categories: Array.isArray(idbData.categories) && idbData.categories.length ? idbData.categories : [...defaultCategories],
        wilayas: Array.isArray(idbData.wilayas) && idbData.wilayas.length ? idbData.wilayas : buildDefaultWilayas(),
        products: Array.isArray(idbData.products) ? idbData.products : [],
        orders: Array.isArray(idbData.orders) ? idbData.orders : [],
      };
    } else {
      // First run in IndexedDB: seed with current in-memory store
      await saveToIndexedDB(store);
    }
  } catch (err) {
    console.warn('initDB fallback:', err);
  }

  dbInitialized = true;
  return store;
}

// Image compression utility: turns large camera photos into ~60KB crisp WebP/JPEG
export function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.82) {
  return new Promise((resolve) => {
    if (!file || !file.type?.startsWith('image/')) {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        // Try WebP first for ultra small size, fallback to JPEG
        try {
          const webp = canvas.toDataURL('image/webp', quality);
          if (webp.startsWith('data:image/webp')) {
            return resolve(webp);
          }
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

function parseProduct(p) {
  const cats = store.categories || [];
  const cat = cats.find(c => Number(c.id) === Number(p.category_id));
  return {
    ...p,
    id: Number(p.id),
    category_id: p.category_id ? Number(p.category_id) : null,
    category_name: cat ? cat.name : 'Mode',
    category_slug: cat ? cat.slug : '',
    price: Number(p.price) || 0,
    old_price: p.old_price ? Number(p.old_price) : null,
    cost_price: Number(p.cost_price) || 0,
    stock: p.stock !== undefined ? Number(p.stock) : 20,
    images: Array.isArray(p.images) ? p.images : [],
    color_images: (p.color_images && typeof p.color_images === 'object') ? p.color_images : {},
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
    colors: Array.isArray(p.colors) ? p.colors : [],
    active: p.active !== 0 ? 1 : 0
  };
}

// ============ PRODUCTS ============
export function getProducts({ categoryId, search, sort } = {}) {
  let list = (store.products || []).filter(p => p.active !== 0);

  if (categoryId) {
    list = list.filter(p => Number(p.category_id) === Number(categoryId));
  }

  if (search) {
    const q = search.toLowerCase().trim();
    list = list.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  }

  if (sort === 'price_asc') {
    list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
  } else if (sort === 'price_desc') {
    list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
  } else {
    // newest
    list.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
  }

  return list.map(parseProduct);
}

export function getAllProductsAdmin() {
  const list = [...(store.products || [])];
  list.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
  return list.map(parseProduct);
}

export function getProductById(id) {
  const numId = Number(id);
  const p = (store.products || []).find(item => Number(item.id) === numId);
  return p ? parseProduct(p) : null;
}

export function addProduct(data) {
  const newId = Date.now();
  const product = {
    ...data,
    id: newId,
    name: String(data.name || '').trim(),
    description: String(data.description || '').trim(),
    category_id: data.category_id ? Number(data.category_id) : null,
    price: Number(data.price) || 0,
    old_price: data.old_price ? Number(data.old_price) : null,
    cost_price: Number(data.cost_price) || 0,
    stock: data.stock !== undefined ? Number(data.stock) : 20,
    badge: data.badge || null,
    active: data.active !== false && data.active !== 0 ? 1 : 0,
    images: Array.isArray(data.images) ? data.images : [],
    color_images: (data.color_images && typeof data.color_images === 'object') ? data.color_images : {},
    sizes: Array.isArray(data.sizes) ? data.sizes : [],
    colors: Array.isArray(data.colors) ? data.colors : [],
    created_at: new Date().toISOString()
  };

  store.products = [product, ...(store.products || [])];
  persist();
  return newId;
}

export function updateProduct(id, data) {
  const numId = Number(id);
  const idx = (store.products || []).findIndex(p => Number(p.id) === numId);
  if (idx !== -1) {
    const existing = store.products[idx];
    store.products[idx] = {
      ...existing,
      ...data,
      id: numId,
      category_id: data.category_id ? Number(data.category_id) : existing.category_id,
      price: data.price !== undefined ? Number(data.price) : existing.price,
      old_price: data.old_price !== undefined ? (data.old_price ? Number(data.old_price) : null) : existing.old_price,
      cost_price: data.cost_price !== undefined ? Number(data.cost_price) : existing.cost_price,
      stock: data.stock !== undefined ? Number(data.stock) : existing.stock,
      active: data.active !== undefined ? (data.active ? 1 : 0) : existing.active,
      images: Array.isArray(data.images) ? data.images : existing.images,
      color_images: data.color_images ? data.color_images : existing.color_images,
      sizes: Array.isArray(data.sizes) ? data.sizes : existing.sizes,
      colors: Array.isArray(data.colors) ? data.colors : existing.colors,
    };
    persist();
  }
}

export function deleteProduct(id) {
  const numId = Number(id);
  store.products = (store.products || []).filter(p => Number(p.id) !== numId);
  persist();
}

export function clearAllProducts() {
  store.products = [];
  persist();
}

// ============ CATEGORIES ============
export function getCategories(activeOnly = false) {
  const list = [...(store.categories || [])];
  return activeOnly ? list.filter(c => c.active === 1) : list;
}

export function addCategory(name, slug) {
  const cleanName = String(name || '').trim();
  const cleanSlug = String(slug || cleanName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  if (!cleanName) return;

  const newCat = {
    id: Date.now(),
    name: cleanName,
    slug: cleanSlug,
    active: 1
  };
  store.categories = [...(store.categories || []), newCat];
  persist();
  return newCat.id;
}

export function updateCategory(id, name, slug, active) {
  const numId = Number(id);
  const cat = (store.categories || []).find(c => Number(c.id) === numId);
  if (cat) {
    if (name !== undefined) cat.name = String(name).trim();
    if (slug !== undefined) cat.slug = String(slug).trim();
    if (active !== undefined) cat.active = active ? 1 : 0;
    persist();
  }
}

export function deleteCategory(id) {
  const numId = Number(id);
  store.categories = (store.categories || []).filter(c => Number(c.id) !== numId);
  persist();
}

// ============ WILAYAS ============
export function getWilayas(activeOnly = false) {
  const list = [...(store.wilayas || [])];
  const filtered = activeOnly ? list.filter(w => w.active === 1) : list;
  return filtered.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

export function addWilaya(name, deliveryPrice, active = 1) {
  const cleanName = String(name || '').trim();
  if (!cleanName) return null;
  const newW = {
    id: Date.now(),
    name: cleanName,
    delivery_price: parseFloat(deliveryPrice) || 0,
    active: active ? 1 : 0
  };
  store.wilayas = [...(store.wilayas || []), newW];
  persist();
  return newW.id;
}

export function updateWilaya(id, deliveryPriceOrObj, active) {
  const numId = Number(id);
  const w = (store.wilayas || []).find(item => Number(item.id) === numId);
  if (w) {
    if (typeof deliveryPriceOrObj === 'object' && deliveryPriceOrObj !== null) {
      if (deliveryPriceOrObj.name) w.name = String(deliveryPriceOrObj.name).trim();
      if (deliveryPriceOrObj.delivery_price !== undefined) {
        w.delivery_price = parseFloat(deliveryPriceOrObj.delivery_price) || 0;
      }
      if (deliveryPriceOrObj.active !== undefined) {
        w.active = deliveryPriceOrObj.active ? 1 : 0;
      }
    } else {
      w.delivery_price = parseFloat(deliveryPriceOrObj) || 0;
      if (active !== undefined) w.active = active ? 1 : 0;
    }
    persist();
  }
}

export function deleteWilaya(id) {
  const numId = Number(id);
  store.wilayas = (store.wilayas || []).filter(w => Number(w.id) !== numId);
  persist();
}

export function resetDefaultWilayas() {
  store.wilayas = buildDefaultWilayas();
  persist();
}

// ============ STOCK HELPERS ============
export function decrementProductStock(items) {
  if (!Array.isArray(items)) return;
  items.forEach(it => {
    const pId = Number(it.id);
    const qty = Number(it.qty) || 1;
    const p = (store.products || []).find(prod => Number(prod.id) === pId);
    if (p) {
      p.stock = Math.max(0, (Number(p.stock) || 0) - qty);
    }
  });
  persist();
}

export function incrementProductStock(items) {
  if (!Array.isArray(items)) return;
  items.forEach(it => {
    const pId = Number(it.id);
    const qty = Number(it.qty) || 1;
    const p = (store.products || []).find(prod => Number(prod.id) === pId);
    if (p) {
      p.stock = (Number(p.stock) || 0) + qty;
    }
  });
  persist();
}

// ============ ORDERS ============
export function getOrders() {
  return [...(store.orders || [])];
}

export function getOrderById(id) {
  return (store.orders || []).find(o => o.id === id || o.order_number === id) || null;
}

export function createOrder(data) {
  const orderNumber = 'WS-' + Date.now().toString().slice(-8).toUpperCase();
  const deliveryType = data.delivery_type || 'home';
  const items = Array.isArray(data.items) ? data.items : [];

  const newOrder = {
    ...data,
    id: Date.now(),
    order_number: orderNumber,
    delivery_type: deliveryType,
    items,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  // 1. Deduct ordered quantities from stock
  decrementProductStock(items);

  // 2. Save new order
  store.orders = [newOrder, ...(store.orders || [])];
  persist();
  return orderNumber;
}

export function updateOrderStatus(id, status) {
  const order = (store.orders || []).find(o => o.id === id || o.order_number === id);
  if (order) {
    const oldStatus = order.status;
    if (oldStatus !== 'cancelled' && status === 'cancelled') {
      // Returning to stock when cancelled!
      incrementProductStock(order.items);
    } else if (oldStatus === 'cancelled' && status !== 'cancelled') {
      // Deduct from stock when re-activated!
      decrementProductStock(order.items);
    }
    order.status = status;
    persist();
  }
}

export function deleteOrder(id) {
  const order = (store.orders || []).find(o => o.id === id || o.order_number === id);
  if (order && order.status !== 'cancelled') {
    incrementProductStock(order.items);
  }
  store.orders = (store.orders || []).filter(o => o.id !== id && o.order_number !== id);
  persist();
}

// ============ STATS ============
export function getStats() {
  const orders = store.orders || [];
  const validOrders = orders.filter(o => o.status !== 'cancelled');
  const revenue = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const pending = orders.filter(o => o.status === 'pending').length;
  const cancelled = orders.filter(o => o.status === 'cancelled').length;
  const activeProducts = (store.products || []).filter(p => p.active !== 0).length;

  return {
    totalOrders: validOrders.length,
    totalAllOrders: orders.length,
    cancelledOrders: cancelled,
    totalRevenue: revenue,
    pendingOrders: pending,
    totalProducts: activeProducts
  };
}

// ============ SETTINGS ============
export function getSetting(key) {
  return store.settings?.[key] ?? defaultSettings[key] ?? null;
}

export function setSetting(key, value) {
  if (!store.settings) store.settings = { ...defaultSettings };
  store.settings[key] = String(value ?? '');
  persist();
}

export function getAllSettings() {
  return { ...defaultSettings, ...(store.settings || {}) };
}

// ============ BACKUP / RESTORE ============
export function exportDB() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(store, null, 2));
  const a = document.createElement('a');
  a.href = dataStr;
  a.download = `walid-shop-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
}

export async function importDB(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed && typeof parsed === 'object') {
          store = {
            settings: { ...defaultSettings, ...(parsed.settings || {}) },
            categories: Array.isArray(parsed.categories) ? parsed.categories : [...defaultCategories],
            wilayas: Array.isArray(parsed.wilayas) ? parsed.wilayas : buildDefaultWilayas(),
            products: Array.isArray(parsed.products) ? parsed.products : [],
            orders: Array.isArray(parsed.orders) ? parsed.orders : []
          };
          persist();
          resolve(true);
        } else {
          reject(new Error('Invalid backup file'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
