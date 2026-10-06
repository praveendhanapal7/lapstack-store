import { isAdmin } from '@/lib/auth';
import { q, tx } from '@/lib/db';
export const dynamic = 'force-dynamic';
const STATUSES = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const PAY = ['pending', 'paid', 'failed', 'refunded', 'refund_pending'];

export async function PATCH(req, { params }) {
  if (!(await isAdmin())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const oid = Number(id);
  const b = await req.json().catch(() => ({}));
  if (b.order_status) {
    if (!STATUSES.includes(b.order_status)) return Response.json({ error: 'Bad status' }, { status: 400 });
    await tx(async (db) => {
      await db('UPDATE orders SET order_status = $1 WHERE id = $2', [b.order_status, oid]);
      if (b.order_status === 'cancelled') {
        // Put the laptops back in stock once.
        const [o] = await db('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [oid]);
        if (o && o.stock_taken) {
          for (const i of JSON.parse(o.items)) await db('UPDATE products SET stock = stock + $1 WHERE id = $2', [i.qty, i.id]);
          await db('UPDATE orders SET stock_taken = 0 WHERE id = $1', [oid]);
        }
      }
    });
  }
  if (b.payment_status) {
    if (!PAY.includes(b.payment_status)) return Response.json({ error: 'Bad payment status' }, { status: 400 });
    await q('UPDATE orders SET payment_status = $1 WHERE id = $2', [b.payment_status, oid]);
  }
  return Response.json({ ok: true });
}
