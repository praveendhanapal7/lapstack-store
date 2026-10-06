import { q, one, tx } from '@/lib/db';
import { getUser } from '@/lib/customer';
import { readAddress } from '@/lib/addresses';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const { value: v, error } = readAddress(b);
  if (error) return Response.json({ error }, { status: 400 });
  const { c } = await one('SELECT COUNT(*)::int AS c FROM addresses WHERE user_id = $1', [user.id]);
  if (c >= 10) return Response.json({ error: 'You can save up to 10 addresses. Please delete one first.' }, { status: 400 });
  const row = await tx(async (db) => {
    const makeDefault = c === 0 || b.is_default;
    if (makeDefault) await db('UPDATE addresses SET is_default = 0 WHERE user_id = $1', [user.id]);
    const [r] = await db(
      'INSERT INTO addresses (user_id,name,phone,address,city,pincode,is_default) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
      [user.id, v.name, v.phone, v.address, v.city, v.pincode, makeDefault ? 1 : 0]);
    return r;
  });
  return Response.json({ ok: true, id: row.id });
}
