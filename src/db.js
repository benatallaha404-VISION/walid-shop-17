// src/db.js - Resilient Database with SQLite (sql.js) & LocalStorage Fallback

let SQL = null;
let db = null;
let isFallbackMode = false;

const DB_KEY = 'walid_shop_db';
const FALLBACK_KEY = 'walid_shop_fallback_store';

const defaultSettings = {
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
};

const defaultCategories = [
  { id: 1, name: 'T-Shirts', slug: 't-shirts', active: 1 },
  { id: 2, name: 'Pantalons', slug: 'pantalons', active: 1 },
  { id: 3, name: 'Vestes', slug: 'vestes', active: 1 },
  { id: 4, name: 'Chaussures', slug: 'chaussures', active: 1 },
  { id: 5, name: 'Accessoires', slug: 'accessoires', active: 1 },
  { id: 6, name: 'Hoodies', slug: 'hoodies', active: 1 },
];

const defaultWilayasList = [
  'Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar',
  'Blida','Bouira','Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger',
  'Djelfa','Jijel','Sétif','Saïda','Skikda','Sidi Bel Abbès','Annaba','Guelma',
  'Constantine','Médéa','Mostaganem','M\'Sila','Mascara','Ouargla','Oran','El Bayadh',
  'Illizi','Bordj Bou Arréridj','Boumerdès','El Tarf','Tindouf','Tissemsilt','El Oued',
  'Khenchela','Souk Ahras','Tipaza','Mila','Aïn Defla','Naâma','Aïn Témouchent',
  'Ghardaïa','Relizane','Timimoun','Bordj Badji Mokhtar'
];
// No default products — store starts empty

// Fallback Store in LocalStorage
let fallbackStore = {
  settings: { ...defaultSettings },
  categories: [...defaultCategories],
  products: [],
  orders: [],
  wilayas: defaultWilayasList.map((name, i) => ({
    id: i + 1,
    name,
    delivery_price: name === 'Alger' ? 400 : name === 'Oran' || name === 'Constantine' ? 500 : 700,
    active: 1
  }))
};

const STORE_VERSION = 'v3-clean'; // bump this to wipe old cached dummy data

function loadFallbackStore() {
  try {
    const raw = localStorage.getItem(FALLBACK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        // If old version (has dummy products seeded before), wipe products
        const isOldVersion = parsed._version !== STORE_VERSION;
        fallbackStore = {
          ...fallbackStore,
          ...parsed,
          _version: STORE_VERSION,
          products: isOldVersion ? [] : (Array.isArray(parsed.products) ? parsed.products : []),
          settings: { ...defaultSettings, ...(parsed.settings || {}) },
          categories: Array.isArray(parsed.categories) ? parsed.categories : [...defaultCategories],
          wilayas: Array.isArray(parsed.wilayas) && parsed.wilayas.length > 0 ? parsed.wilayas : fallbackStore.wilayas,
          orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        };
        if (isOldVersion) {
          // Save immediately to lock in new version and clear old dummy data
          saveFallbackStore();
        }
        return;
      }
    }
  } catch (e) {
    console.warn('Fallback store parsing error, resetting to defaults', e);
  }
  fallbackStore._version = STORE_VERSION;
  saveFallbackStore();
}

function saveFallbackStore() {
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(fallbackStore));
  } catch (e) {
    console.warn('Failed to save fallback store to localStorage', e);
  }
}

export async function initDB() {
  if (db || isFallbackMode) return db || fallbackStore;

  try {
    // 1. Dynamically import sql.js
    const sqlJs = await import('sql.js');
    const initSqlJs = sqlJs.default || sqlJs;

    // 2. Initialize using local sql-wasm.wasm
    SQL = await initSqlJs({
      locateFile: (file) => file.endsWith('.wasm') ? '/sql-wasm.wasm' : `https://sql.js.org/dist/${file}`
    });

    // 3. Try to load existing DB from localStorage
    const saved = localStorage.getItem(DB_KEY);
    let loadedOk = false;

    if (saved) {
      try {
        const arr = JSON.parse(saved);
        const uint8 = new Uint8Array(arr);
        db = new SQL.Database(uint8);

        // Verify database has products table (even if 0 products exist!)
        const check = db.exec("SELECT count(*) FROM sqlite_master WHERE type='table' AND name='products'");
        const count = check[0]?.values[0]?.[0];
        if (typeof count === 'number' && count > 0) {
          loadedOk = true;
        }
      } catch (err) {
        console.warn('Corrupted SQLite DB in localStorage, resetting...', err);
      }
    }

    if (!loadedOk) {
      db = new SQL.Database();
      createSchema();
      seedData();
      saveDB();
    } else {
      runMigrations();
    }

    return db;
  } catch (err) {
    console.warn('sql.js WebAssembly failed or unavailable, using resilient LocalStorage store:', err);
    isFallbackMode = true;
    loadFallbackStore();
    return fallbackStore;
  }
}

function runMigrations() {
  if (!db) return;
  try {
    db.run("ALTER TABLE products ADD COLUMN cost_price REAL DEFAULT 0");
  } catch (_) {}
  try {
    db.run("ALTER TABLE products ADD COLUMN color_images TEXT DEFAULT '{}'");
  } catch (_) {}
  try {
    db.run("ALTER TABLE orders ADD COLUMN delivery_type TEXT DEFAULT 'home'");
  } catch (_) {}
}

export function saveDB() {
  if (isFallbackMode) {
    saveFallbackStore();
    return;
  }
  if (!db) return;
  try {
    const data = db.export();
    const arr = Array.from(data);
    localStorage.setItem(DB_KEY, JSON.stringify(arr));
  } catch (e) {
    console.error('Error saving SQLite DB to localStorage:', e);
  }
}

function createSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category_id INTEGER,
      price REAL NOT NULL,
      old_price REAL,
      cost_price REAL DEFAULT 0,
      images TEXT DEFAULT '[]',
      color_images TEXT DEFAULT '{}',
      sizes TEXT DEFAULT '[]',
      colors TEXT DEFAULT '[]',
      stock INTEGER DEFAULT 0,
      badge TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      delivery_type TEXT DEFAULT 'home',
      wilaya TEXT NOT NULL,
      commune TEXT,
      address TEXT,
      note TEXT,
      items TEXT NOT NULL,
      subtotal REAL NOT NULL,
      delivery_price REAL NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS wilayas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      delivery_price REAL NOT NULL DEFAULT 500,
      active INTEGER DEFAULT 1
    );
  `);
}

function seedData() {
  Object.entries(defaultSettings).forEach(([key, value]) => {
    db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [key, value]);
  });

  defaultCategories.forEach(cat => {
    db.run('INSERT OR IGNORE INTO categories (id, name, slug, active) VALUES (?, ?, ?, ?)', [cat.id, cat.name, cat.slug, cat.active]);
  });

  defaultWilayasList.forEach((name, i) => {
    db.run('INSERT OR IGNORE INTO wilayas (id, name, delivery_price, active) VALUES (?, ?, ?, ?)',
      [i + 1, name, name === 'Alger' ? 400 : name === 'Oran' || name === 'Constantine' ? 500 : 700, 1]);
  });
}

// Helpers
function rowsToObjects(result) {
  if (!result || result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map(row => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

function firstRow(result) {
  const rows = rowsToObjects(result);
  return rows[0] || null;
}

function tryParseJSON(str, fallback) {
  if (!str) return fallback;
  if (typeof str !== 'string') return str;
  try { return JSON.parse(str); } catch { return fallback; }
}

function parseProduct(p) {
  return {
    ...p,
    cost_price: Number(p.cost_price) || 0,
    images: tryParseJSON(p.images, []),
    color_images: tryParseJSON(p.color_images, {}),
    sizes: tryParseJSON(p.sizes, []),
    colors: tryParseJSON(p.colors, []),
  };
}

// ============ SETTINGS ============
export function getSetting(key) {
  if (isFallbackMode || !db) {
    loadFallbackStore();
    return fallbackStore.settings[key] ?? null;
  }
  try {
    const res = db.exec('SELECT value FROM settings WHERE key = ?', [key]);
    const row = firstRow(res);
    return row ? row.value : null;
  } catch {
    return fallbackStore.settings[key] ?? null;
  }
}

export function setSetting(key, value) {
  if (isFallbackMode || !db) {
    fallbackStore.settings[key] = String(value);
    saveFallbackStore();
    return;
  }
  try {
    db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, String(value)]);
    saveDB();
  } catch {
    fallbackStore.settings[key] = String(value);
    saveFallbackStore();
  }
}

export function getAllSettings() {
  if (isFallbackMode || !db) {
    loadFallbackStore();
    return { ...fallbackStore.settings };
  }
  try {
    const res = db.exec('SELECT key, value FROM settings');
    const rows = rowsToObjects(res);
    const obj = {};
    rows.forEach(r => { obj[r.key] = r.value; });
    return obj;
  } catch {
    return { ...fallbackStore.settings };
  }
}

// ============ CATEGORIES ============
export function getCategories(activeOnly = false) {
  if (isFallbackMode || !db) {
    loadFallbackStore();
    return activeOnly ? fallbackStore.categories.filter(c => c.active === 1) : [...fallbackStore.categories];
  }
  try {
    const sql = activeOnly
      ? 'SELECT * FROM categories WHERE active = 1 ORDER BY id'
      : 'SELECT * FROM categories ORDER BY id';
    return rowsToObjects(db.exec(sql));
  } catch {
    return activeOnly ? fallbackStore.categories.filter(c => c.active === 1) : [...fallbackStore.categories];
  }
}

export function addCategory(name, slug) {
  if (isFallbackMode || !db) {
    const id = Date.now();
    fallbackStore.categories.push({ id, name, slug, active: 1 });
    saveFallbackStore();
    return;
  }
  try {
    db.run('INSERT INTO categories (name, slug) VALUES (?, ?)', [name, slug]);
    saveDB();
  } catch {
    fallbackStore.categories.push({ id: Date.now(), name, slug, active: 1 });
    saveFallbackStore();
  }
}

export function updateCategory(id, name, slug, active) {
  if (isFallbackMode || !db) {
    const cat = fallbackStore.categories.find(c => c.id === id);
    if (cat) {
      cat.name = name;
      cat.slug = slug;
      cat.active = active ? 1 : 0;
      saveFallbackStore();
    }
    return;
  }
  try {
    db.run('UPDATE categories SET name=?, slug=?, active=? WHERE id=?', [name, slug, active ? 1 : 0, id]);
    saveDB();
  } catch {
    const cat = fallbackStore.categories.find(c => c.id === id);
    if (cat) {
      cat.name = name;
      cat.slug = slug;
      cat.active = active ? 1 : 0;
      saveFallbackStore();
    }
  }
}

export function deleteCategory(id) {
  if (isFallbackMode || !db) {
    fallbackStore.categories = fallbackStore.categories.filter(c => c.id !== id);
    saveFallbackStore();
    return;
  }
  try {
    db.run('DELETE FROM categories WHERE id=?', [id]);
    saveDB();
  } catch {
    fallbackStore.categories = fallbackStore.categories.filter(c => c.id !== id);
    saveFallbackStore();
  }
}

// ============ PRODUCTS ============
export function getProducts({ categoryId, search, sort } = {}) {
  if (isFallbackMode || !db) {
    loadFallbackStore();
    let list = fallbackStore.products.filter(p => p.active === 1);
    if (categoryId) list = list.filter(p => Number(p.category_id) === Number(categoryId));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    if (sort === 'price_asc') list.sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') list.sort((a, b) => b.price - a.price);
    else if (sort === 'newest') list.sort((a, b) => (b.id || 0) - (a.id || 0));

    const cats = fallbackStore.categories;
    return list.map(p => {
      const cat = cats.find(c => c.id === p.category_id);
      return parseProduct({ ...p, category_name: cat?.name || 'Mode', category_slug: cat?.slug || '' });
    });
  }

  try {
    let sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.active = 1
    `;
    const params = [];

    if (categoryId) {
      sql += ' AND p.category_id = ?';
      params.push(categoryId);
    }
    if (search) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (sort === 'price_asc') sql += ' ORDER BY p.price ASC';
    else if (sort === 'price_desc') sql += ' ORDER BY p.price DESC';
    else if (sort === 'newest') sql += ' ORDER BY p.created_at DESC';
    else sql += ' ORDER BY p.id DESC';

    const res = db.exec(sql, params);
    return rowsToObjects(res).map(parseProduct);
  } catch (e) {
    console.error('getProducts SQLite error, using fallback:', e);
    isFallbackMode = true;
    return getProducts({ categoryId, search, sort });
  }
}

export function getAllProductsAdmin() {
  if (isFallbackMode || !db) {
    loadFallbackStore();
    const cats = fallbackStore.categories;
    return [...fallbackStore.products].reverse().map(p => {
      const cat = cats.find(c => c.id === p.category_id);
      return parseProduct({ ...p, category_name: cat?.name || 'Mode' });
    });
  }

  try {
    const sql = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id DESC
    `;
    return rowsToObjects(db.exec(sql)).map(parseProduct);
  } catch (e) {
    console.error('getAllProductsAdmin SQLite error, using fallback:', e);
    isFallbackMode = true;
    return getAllProductsAdmin();
  }
}

export function getProductById(id) {
  const numId = Number(id);
  if (isFallbackMode || !db) {
    loadFallbackStore();
    const p = fallbackStore.products.find(item => Number(item.id) === numId);
    if (!p) return null;
    const cat = fallbackStore.categories.find(c => c.id === p.category_id);
    return parseProduct({ ...p, category_name: cat?.name || 'Mode', category_slug: cat?.slug || '' });
  }

  try {
    const res = db.exec(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [numId]);
    const row = firstRow(res);
    return row ? parseProduct(row) : null;
  } catch (e) {
    console.error('getProductById SQLite error, using fallback:', e);
    isFallbackMode = true;
    return getProductById(id);
  }
}

export function addProduct(data) {
  const costPrice = Number(data.cost_price) || 0;
  const colorImages = typeof data.color_images === 'object' && data.color_images !== null ? data.color_images : tryParseJSON(data.color_images, {});
  if (isFallbackMode || !db) {
    loadFallbackStore();
    const newProduct = {
      ...data,
      id: Date.now(),
      created_at: new Date().toISOString(),
      active: data.active !== false ? 1 : 0,
      cost_price: costPrice,
      images: Array.isArray(data.images) ? data.images : tryParseJSON(data.images, []),
      color_images: colorImages,
      sizes: Array.isArray(data.sizes) ? data.sizes : tryParseJSON(data.sizes, []),
      colors: Array.isArray(data.colors) ? data.colors : tryParseJSON(data.colors, []),
      stock: Number(data.stock) || 0,
    };
    fallbackStore.products.unshift(newProduct);
    saveFallbackStore();
    return newProduct.id;
  }

  try {
    db.run(
      `INSERT INTO products (name, description, category_id, price, old_price, cost_price, images, color_images, sizes, colors, stock, badge, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.description,
        data.category_id,
        data.price,
        data.old_price || null,
        costPrice,
        JSON.stringify(data.images || []),
        JSON.stringify(colorImages || {}),
        JSON.stringify(data.sizes || []),
        JSON.stringify(data.colors || []),
        data.stock || 0,
        data.badge || null,
        data.active !== false ? 1 : 0,
      ]
    );
    saveDB();
  } catch (e) {
    console.error('addProduct SQLite error, switching to fallback:', e);
    isFallbackMode = true;
    return addProduct(data);
  }
}

export function updateProduct(id, data) {
  const numId = Number(id);
  const costPrice = Number(data.cost_price) || 0;
  const colorImages = typeof data.color_images === 'object' && data.color_images !== null ? data.color_images : tryParseJSON(data.color_images, {});
  if (isFallbackMode || !db) {
    loadFallbackStore();
    const p = fallbackStore.products.find(item => Number(item.id) === numId);
    if (p) {
      Object.assign(p, {
        name: data.name,
        description: data.description,
        category_id: data.category_id,
        price: data.price,
        old_price: data.old_price || null,
        cost_price: costPrice,
        images: Array.isArray(data.images) ? data.images : tryParseJSON(data.images, []),
        color_images: colorImages,
        sizes: Array.isArray(data.sizes) ? data.sizes : tryParseJSON(data.sizes, []),
        colors: Array.isArray(data.colors) ? data.colors : tryParseJSON(data.colors, []),
        stock: Number(data.stock) || 0,
        badge: data.badge || null,
        active: data.active !== false ? 1 : 0,
      });
      saveFallbackStore();
    }
    return;
  }

  try {
    db.run(
      `UPDATE products SET name=?, description=?, category_id=?, price=?, old_price=?, cost_price=?,
       images=?, color_images=?, sizes=?, colors=?, stock=?, badge=?, active=? WHERE id=?`,
      [
        data.name,
        data.description,
        data.category_id,
        data.price,
        data.old_price || null,
        costPrice,
        JSON.stringify(data.images || []),
        JSON.stringify(colorImages || {}),
        JSON.stringify(data.sizes || []),
        JSON.stringify(data.colors || []),
        data.stock || 0,
        data.badge || null,
        data.active !== false ? 1 : 0,
        numId,
      ]
    );
    saveDB();
  } catch (e) {
    console.error('updateProduct SQLite error, switching to fallback:', e);
    isFallbackMode = true;
    updateProduct(id, data);
  }
}

export function deleteProduct(id) {
  const numId = Number(id);
  if (isFallbackMode || !db) {
    loadFallbackStore();
    fallbackStore.products = fallbackStore.products.filter(item => Number(item.id) !== numId);
    saveFallbackStore();
    return;
  }

  try {
    db.run('DELETE FROM products WHERE id = ?', [numId]);
    saveDB();
  } catch (e) {
    console.error('deleteProduct SQLite error:', e);
    loadFallbackStore();
    fallbackStore.products = fallbackStore.products.filter(item => Number(item.id) !== numId);
    saveFallbackStore();
  }
}

export function clearAllProducts() {
  if (isFallbackMode || !db) {
    loadFallbackStore();
    fallbackStore.products = [];
    saveFallbackStore();
    return;
  }

  try {
    db.run('DELETE FROM products');
    saveDB();
  } catch (e) {
    console.error('clearAllProducts SQLite error:', e);
    loadFallbackStore();
    fallbackStore.products = [];
    saveFallbackStore();
  }
}

// ============ ORDERS ============
export function getOrders() {
  if (isFallbackMode || !db) {
    loadFallbackStore();
    return [...fallbackStore.orders].reverse();
  }
  try {
    const res = db.exec('SELECT * FROM orders ORDER BY created_at DESC');
    return rowsToObjects(res).map(o => ({ ...o, items: tryParseJSON(o.items, []) }));
  } catch {
    return [...fallbackStore.orders].reverse();
  }
}

export function getOrderById(id) {
  if (isFallbackMode || !db) {
    return fallbackStore.orders.find(o => o.id === id || o.order_number === id) || null;
  }
  try {
    const res = db.exec('SELECT * FROM orders WHERE id = ? OR order_number = ?', [id, id]);
    const row = firstRow(res);
    return row ? { ...row, items: tryParseJSON(row.items, []) } : null;
  } catch {
    return fallbackStore.orders.find(o => o.id === id || o.order_number === id) || null;
  }
}

export function decrementProductStock(items) {
  if (!Array.isArray(items)) return;
  items.forEach(it => {
    const pId = Number(it.id);
    const qty = Number(it.qty) || 1;
    if (!pId) return;

    if (isFallbackMode || !db) {
      loadFallbackStore();
      const p = fallbackStore.products.find(prod => Number(prod.id) === pId);
      if (p) {
        p.stock = Math.max(0, (Number(p.stock) || 0) - qty);
      }
    } else {
      try {
        db.run('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?', [qty, pId]);
      } catch (e) {
        console.error('Error decrementing stock:', e);
      }
    }
  });

  if (isFallbackMode || !db) {
    saveFallbackStore();
  } else {
    saveDB();
  }
}

export function incrementProductStock(items) {
  if (!Array.isArray(items)) return;
  items.forEach(it => {
    const pId = Number(it.id);
    const qty = Number(it.qty) || 1;
    if (!pId) return;

    if (isFallbackMode || !db) {
      loadFallbackStore();
      const p = fallbackStore.products.find(prod => Number(prod.id) === pId);
      if (p) {
        p.stock = (Number(p.stock) || 0) + qty;
      }
    } else {
      try {
        db.run('UPDATE products SET stock = stock + ? WHERE id = ?', [qty, pId]);
      } catch (e) {
        console.error('Error incrementing stock:', e);
      }
    }
  });

  if (isFallbackMode || !db) {
    saveFallbackStore();
  } else {
    saveDB();
  }
}

export function createOrder(data) {
  const orderNumber = 'WS-' + Date.now().toString().slice(-8).toUpperCase();
  const deliveryType = data.delivery_type || 'home';
  const items = Array.isArray(data.items) ? data.items : tryParseJSON(data.items, []);

  const newOrder = {
    ...data,
    id: Date.now(),
    order_number: orderNumber,
    delivery_type: deliveryType,
    items,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  // Deduct ordered quantities from stock
  decrementProductStock(items);

  if (isFallbackMode || !db) {
    fallbackStore.orders.push(newOrder);
    saveFallbackStore();
    return orderNumber;
  }

  try {
    db.run(
      `INSERT INTO orders (order_number, customer_name, customer_phone, customer_email,
       delivery_type, wilaya, commune, address, note, items, subtotal, delivery_price, total, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber, data.customer_name, data.customer_phone, data.customer_email || '',
        deliveryType, data.wilaya, data.commune || '', data.address || '', data.note || '',
        JSON.stringify(items), data.subtotal, data.delivery_price, data.total,
        'pending',
      ]
    );
    saveDB();
    return orderNumber;
  } catch (e) {
    try {
      db.run(
        `INSERT INTO orders (order_number, customer_name, customer_phone, customer_email,
         wilaya, commune, address, note, items, subtotal, delivery_price, total, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderNumber, data.customer_name, data.customer_phone, data.customer_email || '',
          data.wilaya, data.commune || '', data.address || '', data.note || '',
          JSON.stringify(items), data.subtotal, data.delivery_price, data.total,
          'pending',
        ]
      );
      saveDB();
      return orderNumber;
    } catch (_) {
      fallbackStore.orders.push(newOrder);
      saveFallbackStore();
      return orderNumber;
    }
  }
}

export function updateOrderStatus(id, status) {
  const currentOrder = getOrderById(id);
  const oldStatus = currentOrder?.status;

  // Manage stock on cancellation or uncancellation
  if (currentOrder && Array.isArray(currentOrder.items)) {
    if (oldStatus !== 'cancelled' && status === 'cancelled') {
      // Returning to stock when order is cancelled
      incrementProductStock(currentOrder.items);
    } else if (oldStatus === 'cancelled' && status !== 'cancelled') {
      // Deduct from stock when order is reactivated
      decrementProductStock(currentOrder.items);
    }
  }

  if (isFallbackMode || !db) {
    const o = fallbackStore.orders.find(item => item.id === id || item.order_number === id);
    if (o) {
      o.status = status;
      saveFallbackStore();
    }
    return;
  }
  try {
    db.run('UPDATE orders SET status = ? WHERE id = ? OR order_number = ?', [status, id, id]);
    saveDB();
  } catch {
    const o = fallbackStore.orders.find(item => item.id === id || item.order_number === id);
    if (o) {
      o.status = status;
      saveFallbackStore();
    }
  }
}

export function deleteOrder(id) {
  const currentOrder = getOrderById(id);
  if (currentOrder && currentOrder.status !== 'cancelled' && Array.isArray(currentOrder.items)) {
    // If order was not cancelled, return stock before deletion
    incrementProductStock(currentOrder.items);
  }

  const numId = Number(id);
  if (isFallbackMode || !db) {
    loadFallbackStore();
    fallbackStore.orders = fallbackStore.orders.filter(item => Number(item.id) !== numId && item.order_number !== id);
    saveFallbackStore();
    return;
  }
  try {
    db.run('DELETE FROM orders WHERE id = ? OR order_number = ?', [numId, id]);
    saveDB();
  } catch {
    loadFallbackStore();
    fallbackStore.orders = fallbackStore.orders.filter(item => Number(item.id) !== numId && item.order_number !== id);
    saveFallbackStore();
  }
}

// ============ WILAYAS ============
export function getWilayas(activeOnly = false) {
  if (isFallbackMode || !db) {
    loadFallbackStore();
    const list = activeOnly ? fallbackStore.wilayas.filter(w => w.active === 1) : [...fallbackStore.wilayas];
    return list.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }
  try {
    const sql = activeOnly
      ? 'SELECT * FROM wilayas WHERE active = 1 ORDER BY name ASC'
      : 'SELECT * FROM wilayas ORDER BY name ASC';
    return rowsToObjects(db.exec(sql));
  } catch {
    loadFallbackStore();
    const list = activeOnly ? fallbackStore.wilayas.filter(w => w.active === 1) : [...fallbackStore.wilayas];
    return list.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }
}

export function addWilaya(name, deliveryPrice, active = 1) {
  const price = parseFloat(deliveryPrice) || 0;
  const cleanName = String(name || '').trim();
  if (!cleanName) return null;

  if (isFallbackMode || !db) {
    loadFallbackStore();
    const newW = {
      id: Date.now(),
      name: cleanName,
      delivery_price: price,
      active: active ? 1 : 0,
    };
    fallbackStore.wilayas.push(newW);
    saveFallbackStore();
    return newW.id;
  }

  try {
    db.run('INSERT INTO wilayas (name, delivery_price, active) VALUES (?, ?, ?)', [cleanName, price, active ? 1 : 0]);
    saveDB();
    const res = db.exec('SELECT last_insert_rowid() as id');
    return res[0]?.values[0]?.[0];
  } catch (e) {
    console.error('addWilaya SQLite error:', e);
    loadFallbackStore();
    const newW = {
      id: Date.now(),
      name: cleanName,
      delivery_price: price,
      active: active ? 1 : 0,
    };
    fallbackStore.wilayas.push(newW);
    saveFallbackStore();
    return newW.id;
  }
}

export function updateWilaya(id, deliveryPriceOrObj, active) {
  const numId = Number(id);
  let name = null;
  let price = 0;
  let act = 1;

  if (typeof deliveryPriceOrObj === 'object' && deliveryPriceOrObj !== null) {
    name = deliveryPriceOrObj.name ? String(deliveryPriceOrObj.name).trim() : null;
    price = parseFloat(deliveryPriceOrObj.delivery_price ?? deliveryPriceOrObj.deliveryPrice) || 0;
    act = deliveryPriceOrObj.active !== undefined ? (deliveryPriceOrObj.active ? 1 : 0) : 1;
  } else {
    price = parseFloat(deliveryPriceOrObj) || 0;
    act = active !== undefined ? (active ? 1 : 0) : 1;
  }

  if (isFallbackMode || !db) {
    loadFallbackStore();
    const w = fallbackStore.wilayas.find(item => Number(item.id) === numId);
    if (w) {
      if (name) w.name = name;
      w.delivery_price = price;
      w.active = act;
      saveFallbackStore();
    }
    return;
  }

  try {
    if (name) {
      db.run('UPDATE wilayas SET name=?, delivery_price=?, active=? WHERE id=?', [name, price, act, numId]);
    } else {
      db.run('UPDATE wilayas SET delivery_price=?, active=? WHERE id=?', [price, act, numId]);
    }
    saveDB();
  } catch (e) {
    console.error('updateWilaya SQLite error:', e);
    loadFallbackStore();
    const w = fallbackStore.wilayas.find(item => Number(item.id) === numId);
    if (w) {
      if (name) w.name = name;
      w.delivery_price = price;
      w.active = act;
      saveFallbackStore();
    }
  }
}

export function deleteWilaya(id) {
  const numId = Number(id);
  if (isFallbackMode || !db) {
    loadFallbackStore();
    fallbackStore.wilayas = fallbackStore.wilayas.filter(item => Number(item.id) !== numId);
    saveFallbackStore();
    return;
  }

  try {
    db.run('DELETE FROM wilayas WHERE id=?', [numId]);
    saveDB();
  } catch (e) {
    console.error('deleteWilaya SQLite error:', e);
    loadFallbackStore();
    fallbackStore.wilayas = fallbackStore.wilayas.filter(item => Number(item.id) !== numId);
    saveFallbackStore();
  }
}

export function resetDefaultWilayas() {
  const wilayas = defaultWilayasList.map((name, i) => ({
    id: i + 1,
    name,
    delivery_price: name === 'Alger' ? 400 : name === 'Oran' || name === 'Constantine' ? 500 : 700,
    active: 1
  }));

  if (isFallbackMode || !db) {
    loadFallbackStore();
    fallbackStore.wilayas = wilayas;
    saveFallbackStore();
    return;
  }

  try {
    db.run('DELETE FROM wilayas');
    wilayas.forEach(w => {
      db.run('INSERT INTO wilayas (id, name, delivery_price, active) VALUES (?, ?, ?, ?)', [w.id, w.name, w.delivery_price, w.active]);
    });
    saveDB();
  } catch {
    loadFallbackStore();
    fallbackStore.wilayas = wilayas;
    saveFallbackStore();
  }
}

// ============ STATS ============
export function getStats() {
  if (isFallbackMode || !db) {
    loadFallbackStore();
    const orders = fallbackStore.orders || [];
    const validOrders = orders.filter(o => o.status !== 'cancelled');
    const revenue = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const pending = orders.filter(o => o.status === 'pending').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const activeProducts = (fallbackStore.products || []).filter(p => p.active === 1).length;
    return {
      totalOrders: validOrders.length,
      totalAllOrders: orders.length,
      cancelledOrders: cancelled,
      totalRevenue: revenue,
      pendingOrders: pending,
      totalProducts: activeProducts
    };
  }

  try {
    const validOrdersRes = db.exec("SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue FROM orders WHERE status != 'cancelled'");
    const totalAllRes = db.exec("SELECT COUNT(*) as count FROM orders");
    const pendingRes = db.exec("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'");
    const cancelledRes = db.exec("SELECT COUNT(*) as count FROM orders WHERE status = 'cancelled'");
    const productsRes = db.exec("SELECT COUNT(*) as count FROM products WHERE active = 1");

    const valid = firstRow(validOrdersRes);
    const totalAll = firstRow(totalAllRes);
    const pending = firstRow(pendingRes);
    const cancelled = firstRow(cancelledRes);
    const products = firstRow(productsRes);

    return {
      totalOrders: valid?.count || 0,
      totalAllOrders: totalAll?.count || 0,
      cancelledOrders: cancelled?.count || 0,
      totalRevenue: valid?.revenue || 0,
      pendingOrders: pending?.count || 0,
      totalProducts: products?.count || 0,
    };
  } catch {
    const orders = fallbackStore.orders || [];
    const validOrders = orders.filter(o => o.status !== 'cancelled');
    return {
      totalOrders: validOrders.length,
      totalAllOrders: orders.length,
      cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
      totalRevenue: validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      totalProducts: (fallbackStore.products || []).filter(p => p.active === 1).length
    };
  }
}

// ============ BACKUP / RESTORE ============
export function exportDB() {
  if (isFallbackMode || !db) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fallbackStore));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `walid-shop-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    return;
  }
  try {
    const data = db.export();
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `walid-shop-backup-${new Date().toISOString().slice(0,10)}.sqlite`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Export error:', e);
  }
}

export async function importDB(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(e.target.result);
          fallbackStore = parsed;
          saveFallbackStore();
          isFallbackMode = true;
          resolve(true);
          return;
        }
        const uint8 = new Uint8Array(e.target.result);
        if (SQL) {
          db = new SQL.Database(uint8);
          const arr = Array.from(uint8);
          localStorage.setItem(DB_KEY, JSON.stringify(arr));
        }
        resolve(true);
      } catch (err) {
        reject(err);
      }
    };
    if (file.name.endsWith('.json')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}
