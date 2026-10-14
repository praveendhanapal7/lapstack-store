import { q } from './db';

const IST = 330 * 60000;
export const RANGES = { today: 'Today', yesterday: 'Yesterday', '7d': 'Last 7 days', '30d': 'Last 30 days', month: 'This month' };

// Start/end of the chosen range, in India time, as real instants.
function bounds(range) {
  const dayStart = (t) => Math.floor((t + IST) / 86400000) * 86400000 - IST;
  const now = Date.now(); const t0 = dayStart(now);
  let from = t0, to = now + 1000;
  if (range === 'yesterday') { from = t0 - 86400000; to = t0; }
  else if (range === '7d') from = t0 - 6 * 86400000;
  else if (range === '30d') from = t0 - 29 * 86400000;
  else if (range === 'month') { const d = new Date(now + IST); from = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) - IST; }
  return { from: new Date(from), to: new Date(to) };
}
const utcStr = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

export async function getTraffic(range) {
  if (!RANGES[range]) range = 'today';
  const { from, to } = bounds(range);
  const P = [from, to];
  const W = 'created_at >= $1 AND created_at < $2';
  const cnt = async (sql) => Number((await q(sql, P))[0]?.v || 0);

  const sessions = await cnt(`SELECT COUNT(DISTINCT sid) v FROM site_events WHERE ${W}`);
  const visitors = await cnt(`SELECT COUNT(DISTINCT vid) v FROM site_events WHERE ${W}`);
  const pageViews = await cnt(`SELECT COUNT(*) v FROM site_events WHERE ${W} AND name='page_view'`);
  const step = (n) => cnt(`SELECT COUNT(DISTINCT sid) v FROM site_events WHERE ${W} AND name='${n}'`);
  const productViewers = await step('view_product');
  const cartAdders = await step('add_to_cart');
  const checkouts = await step('checkout');
  const addToCartEvents = await cnt(`SELECT COUNT(*) v FROM site_events WHERE ${W} AND name='add_to_cart'`);

  // Orders come from the real orders table (created_at is UTC text there).
  const O = 'created_at >= $1 AND created_at < $2';
  const OP = [utcStr(from), utcStr(to)];
  const oc = async (sql) => (await q(sql, OP))[0] || {};
  const placed = await oc(`SELECT COUNT(*)::int n FROM orders WHERE ${O}`);
  const paid = await oc(`SELECT COUNT(*)::int n, COALESCE(SUM(total),0)::int rev FROM orders WHERE ${O} AND payment_status='paid' AND order_status!='cancelled'`);
  const failed = await oc(`SELECT COUNT(*)::int n FROM orders WHERE ${O} AND payment_status IN ('failed','pending')`);

  const topProducts = await q(
    `SELECT COALESCE(NULLIF(MAX(product_name),''), 'Product #' || product_id) AS name, product_id,
       COUNT(*) FILTER (WHERE name='view_product')::int views,
       COUNT(*) FILTER (WHERE name='add_to_cart')::int carts
     FROM site_events WHERE ${W} AND product_id IS NOT NULL AND name IN ('view_product','add_to_cart')
     GROUP BY product_id ORDER BY views DESC, carts DESC LIMIT 10`, P);
  const topPages = await q(`SELECT path, COUNT(*)::int views FROM site_events WHERE ${W} AND name='page_view' GROUP BY path ORDER BY views DESC LIMIT 8`, P);
  const sources = await q(`SELECT source, COUNT(DISTINCT sid)::int sessions FROM site_events WHERE ${W} GROUP BY source ORDER BY sessions DESC LIMIT 8`, P);
  const devices = await q(`SELECT device, COUNT(DISTINCT sid)::int sessions FROM site_events WHERE ${W} GROUP BY device ORDER BY sessions DESC`, P);
  const daily = await q(
    `SELECT to_char(created_at at time zone 'Asia/Kolkata','YYYY-MM-DD') d, COUNT(DISTINCT sid)::int sessions
     FROM site_events WHERE ${W} GROUP BY 1 ORDER BY 1`, P);
  const hourly = range === 'today' || range === 'yesterday'
    ? await q(`SELECT to_char(created_at at time zone 'Asia/Kolkata','HH24') d, COUNT(DISTINCT sid)::int sessions FROM site_events WHERE ${W} GROUP BY 1 ORDER BY 1`, P)
    : null;

  return {
    range, label: RANGES[range],
    sessions, visitors, pageViews, productViewers, cartAdders, addToCartEvents, checkouts,
    ordersPlaced: placed.n || 0, ordersPaid: paid.n || 0, revenue: paid.rev || 0, unpaid: failed.n || 0,
    conversion: sessions ? Math.round(((paid.n || 0) / sessions) * 1000) / 10 : 0,
    topProducts, topPages, sources, devices, series: hourly || daily, seriesIsHours: !!hourly,
  };
}
