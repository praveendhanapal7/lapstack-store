import { Pool } from 'pg';
import { SEED } from './seed';

const g = globalThis;

function pool() {
  if (!g.__lsPool) {
    let url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error('DATABASE_URL is not set. Add your Supabase connection string.');
    const local = /localhost|127\.0\.0\.1/.test(url);
    url = url.replace(/([?&])(sslmode|supa)=[^&]*&?/g, '$1').replace(/[?&]$/, '');
    g.__lsPool = new Pool({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false }, max: 3 });
  }
  return g.__lsPool;
}

const NOW = "to_char(now() at time zone 'utc','YYYY-MM-DD HH24:MI:SS')";
const SCHEMA = `
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL, cpu TEXT DEFAULT '', ram TEXT DEFAULT '', storage TEXT DEFAULT '', display TEXT DEFAULT '',
  price INTEGER NOT NULL, stock INTEGER NOT NULL DEFAULT 1, image TEXT DEFAULT '', note TEXT DEFAULT '',
  warranty INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT ${NOW}
);
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT DEFAULT '', address TEXT NOT NULL, city TEXT NOT NULL, pincode TEXT NOT NULL,
  items TEXT NOT NULL, total INTEGER NOT NULL,
  method TEXT NOT NULL, payment_status TEXT NOT NULL DEFAULT 'pending', order_status TEXT NOT NULL DEFAULT 'new',
  razorpay_order_id TEXT, razorpay_payment_id TEXT, stock_taken INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT ${NOW}
);
CREATE TABLE IF NOT EXISTS sell_requests (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT DEFAULT '', city TEXT DEFAULT '',
  brand TEXT NOT NULL, model TEXT NOT NULL, cpu TEXT DEFAULT '', ram TEXT DEFAULT '', storage TEXT DEFAULT '',
  condition TEXT DEFAULT '', purchase_date TEXT DEFAULT '', expected_price INTEGER DEFAULT 0, notes TEXT DEFAULT '',
  photos TEXT NOT NULL DEFAULT '[]', bill TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT ${NOW}
);`;

async function init() {
  const c = await pool().connect();
  try {
    await c.query('SELECT pg_advisory_lock(727001)');
    await c.query(SCHEMA);
    const { rows } = await c.query('SELECT COUNT(*)::int AS c FROM products');
    if (rows[0].c === 0) {
      for (const p of SEED) {
        await c.query(
          `INSERT INTO products (name,cpu,ram,storage,display,price,stock,image,note,warranty) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [p.name, p.cpu, p.ram, p.storage, p.display, p.price, p.stock, p.image, p.note, p.warranty]
        );
      }
    }
    await c.query('SELECT pg_advisory_unlock(727001)');
  } finally {
    c.release();
  }
}

async function ready() {
  if (!g.__lsReady) g.__lsReady = init().catch((e) => { g.__lsReady = null; throw e; });
  await g.__lsReady;
  return pool();
}

/** Run a query, get rows back. Use $1, $2 … for parameters. */
export async function q(sql, params = []) {
  const p = await ready();
  return (await p.query(sql, params)).rows;
}
export async function one(sql, params = []) {
  return (await q(sql, params))[0];
}
/** Run several queries in one transaction. fn receives a query function. */
export async function tx(fn) {
  const p = await ready();
  const c = await p.connect();
  try {
    await c.query('BEGIN');
    const out = await fn(async (sql, params = []) => (await c.query(sql, params)).rows);
    await c.query('COMMIT');
    return out;
  } catch (e) {
    await c.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

export const band = (p) => (p <= 25000 ? 'low' : p <= 35000 ? 'mid' : 'high');

export async function listProducts({ all = false } = {}) {
  return q(`SELECT * FROM products ${all ? '' : 'WHERE active = 1'} ORDER BY price ASC, id ASC`);
}
export async function getProduct(id) {
  if (!Number.isInteger(id)) return undefined;
  return one('SELECT * FROM products WHERE id = $1', [id]);
}
