import crypto from 'node:crypto';
import { tx, one } from './db';

export { inr } from './format';

export function newCode() {
  return 'LS-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

/** Reduce stock once per order (safe to call twice). */
export async function takeStock(orderId) {
  await tx(async (db) => {
    const [o] = await db('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [orderId]);
    if (!o || o.stock_taken) return;
    for (const i of JSON.parse(o.items)) await db('UPDATE products SET stock = GREATEST(stock - $1, 0) WHERE id = $2', [i.qty, i.id]);
    await db('UPDATE orders SET stock_taken = 1 WHERE id = $1', [orderId]);
  });
}

export async function getOrderByCode(code) {
  const o = await one('SELECT * FROM orders WHERE code = $1', [code]);
  return o ? { ...o, items: JSON.parse(o.items) } : null;
}
