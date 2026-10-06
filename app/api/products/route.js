import { q } from '@/lib/db';
export const dynamic = 'force-dynamic';
// Public: look up current price/stock for cart ids.
export async function GET(req) {
  const ids = (new URL(req.url).searchParams.get('ids') || '').split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 50);
  if (!ids.length) return Response.json([]);
  return Response.json(await q('SELECT id,name,price,stock,image,active FROM products WHERE id = ANY($1::int[])', [ids]));
}
