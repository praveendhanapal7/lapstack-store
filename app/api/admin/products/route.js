import { isAdmin } from '@/lib/auth';
import { one, listProducts } from '@/lib/db';
import { cleanProduct } from '@/lib/product-input';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  return Response.json(await listProducts({ all: true }));
}
export async function POST(req) {
  if (!(await isAdmin())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { value: v, error } = cleanProduct(await req.json().catch(() => ({})));
  if (error) return Response.json({ error }, { status: 400 });
  const r = await one(`INSERT INTO products (name,cpu,ram,storage,display,price,stock,image,images,note,warranty,active)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`, [v.name, v.cpu, v.ram, v.storage, v.display, v.price, v.stock, v.image, v.images, v.note, v.warranty, v.active]);
  return Response.json({ id: r.id });
}
