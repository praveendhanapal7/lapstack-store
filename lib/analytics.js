import { q, one } from './db';

const LIVE = "order_status != 'cancelled' AND payment_status IN ('paid')";
const IST = "((created_at::timestamp + interval '5 hours 30 minutes')::date)";

export async function getAnalytics() {
  const n = async (sql, params = []) => Number((await one(sql, params)).v || 0);
  const today = (await one("SELECT ((now() at time zone 'utc') + interval '5 hours 30 minutes')::date::text AS d")).d;

  const k = {
    totalOrders: await n('SELECT COUNT(*) v FROM orders'),
    todayOrders: await n(`SELECT COUNT(*) v FROM orders WHERE ${IST}::text = $1`, [today]),
    newOrders: await n("SELECT COUNT(*) v FROM orders WHERE order_status = 'new'"),
    revenue: await n(`SELECT COALESCE(SUM(total),0) v FROM orders WHERE ${LIVE}`),
    onlinePaid: await n("SELECT COALESCE(SUM(total),0) v FROM orders WHERE payment_status='paid' AND order_status != 'cancelled'"),
    toShip: await n("SELECT COUNT(*) v FROM orders WHERE order_status='confirmed'"),
    failed: await n("SELECT COALESCE(SUM(total),0) v FROM orders WHERE payment_status='failed'"),
    pendingPay: await n("SELECT COALESCE(SUM(total),0) v FROM orders WHERE payment_status='pending'"),
    refunded: await n("SELECT COALESCE(SUM(total),0) v FROM orders WHERE payment_status='refunded'"),
    avgOrder: Math.round(Number((await one(`SELECT COALESCE(AVG(total),0) v FROM orders WHERE ${LIVE}`)).v)),
    liveProducts: await n('SELECT COUNT(*) v FROM products WHERE active=1'),
    soldOut: await n('SELECT COUNT(*) v FROM products WHERE active=1 AND stock<1'),
    newSell: await n("SELECT COUNT(*) v FROM sell_requests WHERE status='new'"),
  };

  const rows = await q(`SELECT ${IST}::text d, COUNT(*)::int n, COALESCE(SUM(CASE WHEN ${LIVE} THEN total ELSE 0 END),0)::int rev
    FROM orders WHERE ${IST} >= ($1::date - 13) GROUP BY 1`, [today]);
  const map = Object.fromEntries(rows.map((r) => [r.d, r]));
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(new Date(today + 'T00:00:00Z').getTime() - i * 86400000).toISOString().slice(0, 10);
    days.push({ d, n: map[d]?.n || 0, rev: map[d]?.rev || 0 });
  }
  const byStatus = await q('SELECT order_status s, COUNT(*)::int c FROM orders GROUP BY order_status');
  const byPay = await q('SELECT payment_status s, COUNT(*)::int c, COALESCE(SUM(total),0)::int amt FROM orders GROUP BY payment_status');
  const byMethod = await q(`SELECT method m, COUNT(*)::int c, COALESCE(SUM(CASE WHEN ${LIVE} THEN total ELSE 0 END),0)::int amt FROM orders GROUP BY method`);

  const units = {};
  (await q("SELECT items FROM orders WHERE order_status != 'cancelled'")).forEach((o) =>
    JSON.parse(o.items).forEach((i) => { units[i.name] = (units[i.name] || 0) + i.qty; }));
  const top = Object.entries(units).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, qty]) => ({ name, qty }));
  const lowStock = await q('SELECT id,name,stock FROM products WHERE active=1 AND stock<=1 ORDER BY stock ASC, name LIMIT 8');
  return { k, days, byStatus, byPay, byMethod, top, lowStock };
}
