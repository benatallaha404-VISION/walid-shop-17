// server/index.js - Express + SQLite Backend for Walid Shop
import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

// ─── Database Setup ───────────────────────────────────────────────────────────
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'walid_shop.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ───────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS wilayas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    delivery_price REAL NOT NULL DEFAULT 700,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    price REAL NOT NULL DEFAULT 0,
    old_price REAL,
    cost_price REAL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    badge TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    images TEXT DEFAULT '[]',
    color_images TEXT DEFAULT '{}',
    sizes TEXT DEFAULT '[]',
    colors TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT DEFAULT '',
    delivery_type TEXT DEFAULT 'home',
    wilaya TEXT NOT NULL,
    commune TEXT DEFAULT '',
    address TEXT DEFAULT '',
    note TEXT DEFAULT '',
    items TEXT NOT NULL DEFAULT '[]',
    subtotal REAL NOT NULL DEFAULT 0,
    delivery_price REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// ─── Seed defaults ────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
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

const insertSetting = db.prepare(`INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)`);
for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
  insertSetting.run(k, String(v));
}

const catCount = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
if (catCount === 0) {
  const cats = [
    ['T-Shirts', 't-shirts'],
    ['Pantalons', 'pantalons'],
    ['Vestes', 'vestes'],
    ['Chaussures', 'chaussures'],
    ['Accessoires', 'accessoires'],
    ['Hoodies', 'hoodies'],
  ];
  const insC = db.prepare(`INSERT OR IGNORE INTO categories(name,slug,active) VALUES(?,?,1)`);
  for (const [name, slug] of cats) insC.run(name, slug);
}

const wilCount = db.prepare('SELECT COUNT(*) as c FROM wilayas').get().c;
if (wilCount === 0) {
  const wilayas = [
    'Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar',
    'Blida','Bouira','Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger',
    'Djelfa','Jijel','Sétif','Saïda','Skikda','Sidi Bel Abbès','Annaba','Guelma',
    'Constantine','Médéa','Mostaganem',"M'Sila",'Mascara','Ouargla','Oran','El Bayadh',
    'Illizi','Bordj Bou Arréridj','Boumerdès','El Tarf','Tindouf','Tissemsilt','El Oued',
    'Khenchela','Souk Ahras','Tipaza','Mila','Aïn Defla','Naâma','Aïn Témouchent',
    'Ghardaïa','Relizane','Timimoun','Bordj Badji Mokhtar','Ouled Djellal','Béni Abbès',
    'In Salah','In Guezzam','Touggourt','Djanet',"El M'Ghair",'El Meniaa'
  ];
  const insW = db.prepare(`INSERT OR IGNORE INTO wilayas(name,delivery_price,active) VALUES(?,?,1)`);
  for (const w of wilayas) {
    const price = w === 'Alger' ? 400 : (w === 'Oran' || w === 'Constantine' || w === 'Blida') ? 500 : 700;
    insW.run(w, price);
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve built frontend in production
const DIST = path.join(__dirname, '..', 'dist');
app.use(express.static(DIST));

// ─── Helpers ──────────────────────────────────────────────────────────────────
const parseJSON = (v, fallback) => { try { return JSON.parse(v) || fallback; } catch { return fallback; } };

function parseProduct(p) {
  return {
    ...p,
    images: parseJSON(p.images, []),
    color_images: parseJSON(p.color_images, {}),
    sizes: parseJSON(p.sizes, []),
    colors: parseJSON(p.colors, []),
    active: p.active === 1 || p.active === true ? 1 : 0,
  };
}

function parseOrder(o) {
  return { ...o, items: parseJSON(o.items, []) };
}

function genOrderNumber() {
  return 'WS-' + Date.now().toString().slice(-8).toUpperCase();
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
app.get('/api/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const obj = {};
  for (const r of rows) obj[r.key] = r.value;
  // Merge defaults
  res.json({ ...DEFAULT_SETTINGS, ...obj });
});

app.post('/api/settings', (req, res) => {
  const data = req.body;
  const upsert = db.prepare(`INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`);
  const upsertMany = db.transaction((entries) => {
    for (const [k, v] of entries) upsert.run(k, String(v ?? ''));
  });
  upsertMany(Object.entries(data));
  res.json({ ok: true });
});

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
app.get('/api/categories', (req, res) => {
  const activeOnly = req.query.active === '1';
  let rows = activeOnly
    ? db.prepare('SELECT * FROM categories WHERE active=1 ORDER BY name').all()
    : db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.json(rows);
});

app.post('/api/categories', (req, res) => {
  const { name, slug, active = 1 } = req.body;
  const cleanSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  try {
    const info = db.prepare('INSERT INTO categories(name,slug,active) VALUES(?,?,?)').run(name, cleanSlug, active);
    res.json({ id: info.lastInsertRowid, name, slug: cleanSlug, active });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/categories/:id', (req, res) => {
  const { name, slug, active } = req.body;
  db.prepare('UPDATE categories SET name=COALESCE(?,name), slug=COALESCE(?,slug), active=COALESCE(?,active) WHERE id=?')
    .run(name, slug, active, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/categories/:id', (req, res) => {
  db.prepare('DELETE FROM categories WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ─── WILAYAS ──────────────────────────────────────────────────────────────────
app.get('/api/wilayas', (req, res) => {
  const activeOnly = req.query.active === '1';
  let rows = activeOnly
    ? db.prepare('SELECT * FROM wilayas WHERE active=1 ORDER BY name').all()
    : db.prepare('SELECT * FROM wilayas ORDER BY name').all();
  res.json(rows);
});

app.post('/api/wilayas', (req, res) => {
  const { name, delivery_price = 700, active = 1 } = req.body;
  try {
    const info = db.prepare('INSERT INTO wilayas(name,delivery_price,active) VALUES(?,?,?)').run(name, delivery_price, active);
    res.json({ id: info.lastInsertRowid, name, delivery_price, active });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/wilayas/:id', (req, res) => {
  const { name, delivery_price, active } = req.body;
  db.prepare('UPDATE wilayas SET name=COALESCE(?,name), delivery_price=COALESCE(?,delivery_price), active=COALESCE(?,active) WHERE id=?')
    .run(name, delivery_price, active, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/wilayas/:id', (req, res) => {
  db.prepare('DELETE FROM wilayas WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

app.post('/api/wilayas/reset', (req, res) => {
  const wilayas = [
    'Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar',
    'Blida','Bouira','Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger',
    'Djelfa','Jijel','Sétif','Saïda','Skikda','Sidi Bel Abbès','Annaba','Guelma',
    'Constantine','Médéa','Mostaganem',"M'Sila",'Mascara','Ouargla','Oran','El Bayadh',
    'Illizi','Bordj Bou Arréridj','Boumerdès','El Tarf','Tindouf','Tissemsilt','El Oued',
    'Khenchela','Souk Ahras','Tipaza','Mila','Aïn Defla','Naâma','Aïn Témouchent',
    'Ghardaïa','Relizane','Timimoun','Bordj Badji Mokhtar','Ouled Djellal','Béni Abbès',
    'In Salah','In Guezzam','Touggourt','Djanet',"El M'Ghair",'El Meniaa'
  ];
  db.prepare('DELETE FROM wilayas').run();
  const ins = db.prepare('INSERT INTO wilayas(name,delivery_price,active) VALUES(?,?,1)');
  const t = db.transaction(() => {
    for (const w of wilayas) {
      const price = w === 'Alger' ? 400 : (w === 'Oran' || w === 'Constantine' || w === 'Blida') ? 500 : 700;
      ins.run(w, price);
    }
  });
  t();
  res.json({ ok: true });
});

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
app.get('/api/products', (req, res) => {
  const { category, search, sort, admin } = req.query;
  let sql = admin === '1'
    ? 'SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id=c.id'
    : 'SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id=c.id WHERE p.active=1';

  const params = [];
  const conditions = [];
  if (admin !== '1') conditions.push('p.active=1');

  if (category) { conditions.push('p.category_id=?'); params.push(category); }
  if (search) { conditions.push('(p.name LIKE ? OR p.description LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }

  if (admin === '1') {
    sql = `SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id=c.id`;
    const where = conditions.join(' AND ');
    if (where) sql += ` WHERE ${where}`;
  } else {
    sql = `SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id=c.id WHERE p.active=1`;
    if (category) { sql += ' AND p.category_id=?'; params.push(category); }
    if (search) { sql += ' AND (p.name LIKE ? OR p.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  }

  if (sort === 'price_asc') sql += ' ORDER BY p.price ASC';
  else if (sort === 'price_desc') sql += ' ORDER BY p.price DESC';
  else sql += ' ORDER BY p.id DESC';

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(parseProduct));
});

app.get('/api/products/:id', (req, res) => {
  const row = db.prepare('SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id=c.id WHERE p.id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(parseProduct(row));
});

app.post('/api/products', (req, res) => {
  const d = req.body;
  const info = db.prepare(`
    INSERT INTO products(name,description,category_id,price,old_price,cost_price,stock,badge,active,images,color_images,sizes,colors)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    d.name, d.description || '', d.category_id || null,
    Number(d.price) || 0, d.old_price ? Number(d.old_price) : null,
    Number(d.cost_price) || 0, Number(d.stock) || 0,
    d.badge || null, d.active !== false ? 1 : 0,
    JSON.stringify(d.images || []),
    JSON.stringify(d.color_images || {}),
    JSON.stringify(d.sizes || []),
    JSON.stringify(d.colors || [])
  );
  res.json({ id: info.lastInsertRowid });
});

app.put('/api/products/:id', (req, res) => {
  const d = req.body;
  db.prepare(`
    UPDATE products SET
      name=COALESCE(?,name), description=COALESCE(?,description),
      category_id=?, price=COALESCE(?,price), old_price=?,
      cost_price=COALESCE(?,cost_price), stock=COALESCE(?,stock),
      badge=?, active=COALESCE(?,active),
      images=COALESCE(?,images), color_images=COALESCE(?,color_images),
      sizes=COALESCE(?,sizes), colors=COALESCE(?,colors)
    WHERE id=?
  `).run(
    d.name, d.description, d.category_id ?? null,
    d.price !== undefined ? Number(d.price) : undefined,
    d.old_price !== undefined ? (d.old_price ? Number(d.old_price) : null) : undefined,
    d.cost_price !== undefined ? Number(d.cost_price) : undefined,
    d.stock !== undefined ? Number(d.stock) : undefined,
    d.badge !== undefined ? d.badge : undefined,
    d.active !== undefined ? (d.active ? 1 : 0) : undefined,
    d.images !== undefined ? JSON.stringify(d.images) : undefined,
    d.color_images !== undefined ? JSON.stringify(d.color_images) : undefined,
    d.sizes !== undefined ? JSON.stringify(d.sizes) : undefined,
    d.colors !== undefined ? JSON.stringify(d.colors) : undefined,
    req.params.id
  );
  res.json({ ok: true });
});

app.delete('/api/products/:id', (req, res) => {
  db.prepare('DELETE FROM products WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

app.delete('/api/products', (req, res) => {
  db.prepare('DELETE FROM products').run();
  res.json({ ok: true });
});

// ─── ORDERS ───────────────────────────────────────────────────────────────────
app.get('/api/orders', (req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY id DESC').all();
  res.json(rows.map(parseOrder));
});

app.post('/api/orders', (req, res) => {
  const d = req.body;
  const orderNumber = genOrderNumber();

  // Decrement stock
  const items = d.items || [];
  const decrStmt = db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE id=?');
  const decrAll = db.transaction(() => {
    for (const it of items) {
      decrStmt.run(Number(it.qty) || 1, Number(it.id));
    }
  });
  decrAll();

  const info = db.prepare(`
    INSERT INTO orders(order_number,customer_name,customer_phone,customer_email,delivery_type,wilaya,commune,address,note,items,subtotal,delivery_price,total,status)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,'pending')
  `).run(
    orderNumber, d.customer_name, d.customer_phone, d.customer_email || '',
    d.delivery_type || 'home', d.wilaya, d.commune || '', d.address || '', d.note || '',
    JSON.stringify(items),
    Number(d.subtotal) || 0, Number(d.delivery_price) || 0, Number(d.total) || 0
  );

  res.json({ id: info.lastInsertRowid, order_number: orderNumber });
});

app.put('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const id = req.params.id;
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const oldStatus = order.status;
  const items = parseJSON(order.items, []);

  db.prepare('UPDATE orders SET status=? WHERE id=?').run(status, id);

  // Stock adjustments on status change
  if (status === 'cancelled' && oldStatus !== 'cancelled') {
    // Return to stock
    const incr = db.prepare('UPDATE products SET stock = stock + ? WHERE id=?');
    const t = db.transaction(() => {
      for (const it of items) incr.run(Number(it.qty) || 1, Number(it.id));
    });
    t();
  } else if (oldStatus === 'cancelled' && status !== 'cancelled') {
    // Re-deduct from stock
    const decr = db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE id=?');
    const t = db.transaction(() => {
      for (const it of items) decr.run(Number(it.qty) || 1, Number(it.id));
    });
    t();
  }

  res.json({ ok: true });
});

app.delete('/api/orders/:id', (req, res) => {
  const id = req.params.id;
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(id);
  if (order && order.status !== 'cancelled') {
    // Return stock
    const items = parseJSON(order.items, []);
    const incr = db.prepare('UPDATE products SET stock = stock + ? WHERE id=?');
    const t = db.transaction(() => {
      for (const it of items) incr.run(Number(it.qty) || 1, Number(it.id));
    });
    t();
  }
  db.prepare('DELETE FROM orders WHERE id=?').run(id);
  res.json({ ok: true });
});

// ─── STATS ────────────────────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  const totalOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status != 'cancelled'").get().c;
  const totalAllOrders = db.prepare("SELECT COUNT(*) as c FROM orders").get().c;
  const cancelledOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status='cancelled'").get().c;
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(total),0) as r FROM orders WHERE status != 'cancelled'").get().r;
  const pendingOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status='pending'").get().c;
  const totalProducts = db.prepare("SELECT COUNT(*) as c FROM products WHERE active=1").get().c;

  res.json({ totalOrders, totalAllOrders, cancelledOrders, totalRevenue, pendingOrders, totalProducts });
});

// ─── SPA fallback ─────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    const indexPath = path.join(DIST, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Walid Shop Server running on 0.0.0.0:${PORT}`);
});
