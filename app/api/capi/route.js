import { sendCapi, visitor } from '@/lib/capi';
export const dynamic = 'force-dynamic';

// The browser reports a Pixel event here as well; we forward it to Meta with the same event id,
// so Meta counts it once even if the browser copy was blocked. (Bookings are sent from /api/enquiries.)
const ALLOWED = ['ViewContent', 'PageView', 'Contact'];
const clip = (v, n) => String(v ?? '').slice(0, n);

export async function POST(req) {
  const ua = req.headers.get('user-agent') || '';
  if (/bot|crawl|spider|facebookexternalhit|preview|headless/i.test(ua)) return new Response(null, { status: 204 });
  const b = await req.json().catch(() => null);
  if (!b || !ALLOWED.includes(b.name) || !b.id) return new Response(null, { status: 204 });
  const c = b.custom || {};
  const custom = {
    content_ids: Array.isArray(c.content_ids) ? c.content_ids.slice(0, 5).map((x) => clip(x, 20)) : undefined,
    content_name: c.content_name ? clip(c.content_name, 120) : undefined,
    content_type: c.content_type ? 'product' : undefined,
    value: Number(c.value) > 0 ? Math.round(Number(c.value)) : undefined,
    currency: Number(c.value) > 0 ? 'INR' : undefined,
  };
  const url = clip(b.url, 300);
  await sendCapi({ name: b.name, id: clip(b.id, 64), url: url.startsWith('https://lapstack.in') ? url : 'https://lapstack.in/', who: visitor(req), custom });
  return new Response(null, { status: 204 });
}
