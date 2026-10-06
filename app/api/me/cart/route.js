import { q, one } from '@/lib/db';
import { getUser } from '@/lib/customer';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();
  if (!user) return Response.json({ items: [] });
  const r = await one('SELECT items FROM carts WHERE user_id = $1', [user.id]);
  return Response.json({ items: r ? JSON.parse(r.items) : [] });
}

export async function PUT(req) {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const items = (Array.isArray(b.items) ? b.items : [])
    .map((i) => ({ id: Number(i.id), qty: Math.max(1, Math.min(10, parseInt(i.qty, 10) || 1)) }))
    .filter((i) => Number.isInteger(i.id) && i.id > 0).slice(0, 30);
  await q(`INSERT INTO carts (user_id, items, updated_at) VALUES ($1, $2, now())
           ON CONFLICT (user_id) DO UPDATE SET items = $2, updated_at = now()`, [user.id, JSON.stringify(items)]);
  return Response.json({ ok: true });
}
