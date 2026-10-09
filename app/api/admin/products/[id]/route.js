import { isAdmin } from '@/lib/auth';
import { q } from '@/lib/db';
import { cleanProduct } from '@/lib/product-input';
export const dynamic = 'force-dynamic';

export async function PUT(req, { params }) {
  if (!(await isAdmin())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { value: v, error } = cleanProduct(await req.json().catch(() => ({})));
  if (error) return Response.json({ error }, { status: 400 });
  await q(`UPDATE products SET name=$1,cpu=$2,ram=$3,storage=$4,display=$5,price=$6,stock=$7,image=$8,images=$9,note=$10,warranty=$11,active=$12,gpu=$14 WHERE id=$13`,
    [v.name, v.cpu, v.ram, v.storage, v.display, v.price, v.stock, v.image, v.images, v.note, v.warranty, v.active, Number(id), v.gpu]);
  return Response.json({ ok: true });
}
export async function DELETE(req, { params }) {
  if (!(await isAdmin())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  // ?hard=1 removes the laptop for good. Past orders keep their own copy of name and price, so history is safe.
  if (new URL(req.url).searchParams.get('hard') === '1') await q('DELETE FROM products WHERE id = $1', [Number(id)]);
  else await q('UPDATE products SET active = 0 WHERE id = $1', [Number(id)]);
  return Response.json({ ok: true });
}
