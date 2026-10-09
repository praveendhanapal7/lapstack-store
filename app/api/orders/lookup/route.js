import { one } from '@/lib/db';
export const dynamic = 'force-dynamic';

// Track order: the order number and the phone used on the order must both match.
export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  const code = String(b.code || '').trim().toUpperCase().replace(/^(LS)?-?/, 'LS-');
  const phone = String(b.phone || '').replace(/\D/g, '').slice(-10);
  const o = phone.length === 10 ? await one('SELECT code FROM orders WHERE code = $1 AND phone = $2', [code, phone]) : null;
  if (!o) return Response.json({ error: 'No order found with that order number and phone. Please check and try again.' }, { status: 404 });
  return Response.json({ code: o.code });
}
