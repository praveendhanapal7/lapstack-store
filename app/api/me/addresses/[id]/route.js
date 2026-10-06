import { q, tx } from '@/lib/db';
import { getUser } from '@/lib/customer';
import { readAddress } from '@/lib/addresses';
export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });
  const id = Number((await params).id);
  const b = await req.json().catch(() => ({}));
  await tx(async (db) => {
    if (b.make_default) {
      await db('UPDATE addresses SET is_default = 0 WHERE user_id = $1', [user.id]);
      await db('UPDATE addresses SET is_default = 1 WHERE id = $1 AND user_id = $2', [id, user.id]);
    }
  });
  if (b.address !== undefined) {
    const { value: v, error } = readAddress(b);
    if (error) return Response.json({ error }, { status: 400 });
    await q('UPDATE addresses SET name=$1, phone=$2, address=$3, city=$4, pincode=$5 WHERE id=$6 AND user_id=$7', [v.name, v.phone, v.address, v.city, v.pincode, id, user.id]);
  }
  return Response.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });
  const id = Number((await params).id);
  await tx(async (db) => {
    const [gone] = await db('DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING is_default', [id, user.id]);
    if (gone?.is_default) await db('UPDATE addresses SET is_default = 1 WHERE id = (SELECT id FROM addresses WHERE user_id = $1 ORDER BY id DESC LIMIT 1)', [user.id]);
  });
  return Response.json({ ok: true });
}
