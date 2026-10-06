import { q } from '@/lib/db';
import { getUser } from '@/lib/customer';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();
  if (!user) return Response.json({ user: null, addresses: [] });
  const addresses = await q('SELECT id, name, phone, address, city, pincode, is_default FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, id DESC', [user.id]);
  return Response.json({ user, addresses });
}

export async function PATCH(req) {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || '').trim().slice(0, 80);
  const phone = String(b.phone || '').replace(/\D/g, '').slice(-10);
  if (phone && phone.length !== 10) return Response.json({ error: 'Phone must be 10 digits.' }, { status: 400 });
  await q('UPDATE users SET name = $1, phone = $2 WHERE id = $3', [name, phone, user.id]);
  return Response.json({ ok: true });
}
