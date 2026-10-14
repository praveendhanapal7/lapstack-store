import { q } from '@/lib/db';
export const dynamic = 'force-dynamic';

const NAMES = ['page_view', 'view_product', 'add_to_cart', 'checkout', 'purchase'];
const clip = (v, n) => String(v ?? '').slice(0, n);

// Our own visitor counter (no personal data): one row per page view / shopping step.
export async function POST(req) {
  const ua = req.headers.get('user-agent') || '';
  if (/bot|crawl|spider|facebookexternalhit|preview|headless/i.test(ua)) return new Response(null, { status: 204 });
  const b = await req.json().catch(() => null);
  if (!b || !NAMES.includes(b.name) || !b.sid) return new Response(null, { status: 204 });
  const path = clip(b.path, 200);
  if (path.startsWith('/admin') || path.startsWith('/api')) return new Response(null, { status: 204 });
  const pid = Number(b.product_id);
  const device = /Mobi|Android|iPhone/i.test(ua) ? 'Mobile' : /iPad|Tablet/i.test(ua) ? 'Tablet' : 'Desktop';
  await q(
    'INSERT INTO site_events (sid, vid, name, path, product_id, product_name, value, source, device) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [clip(b.sid, 40), clip(b.vid, 40), b.name, path, Number.isInteger(pid) && pid > 0 ? pid : null, clip(b.product_name, 120), Math.max(0, Math.round(Number(b.value) || 0)), clip(b.source || 'Direct', 40), device]
  ).catch(() => {});
  return new Response(null, { status: 204 });
}
