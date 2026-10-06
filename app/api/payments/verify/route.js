import { q, one } from '@/lib/db';
import { takeStock } from '@/lib/orders';
import { verifySignature } from '@/lib/razorpay';
import { alertShop } from '@/lib/notify';
import { inr } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  const o = await one('SELECT * FROM orders WHERE code = $1 AND razorpay_order_id = $2', [String(b.code || ''), String(b.razorpay_order_id || '')]);
  if (!o) return Response.json({ error: 'Order not found' }, { status: 404 });
  const ok = verifySignature({ orderId: b.razorpay_order_id, paymentId: b.razorpay_payment_id, signature: b.razorpay_signature });
  if (!ok) {
    await q("UPDATE orders SET payment_status = 'failed' WHERE id = $1", [o.id]);
    return Response.json({ error: 'Payment could not be verified' }, { status: 400 });
  }
  await q("UPDATE orders SET payment_status = 'paid', razorpay_payment_id = $1, order_status = 'confirmed' WHERE id = $2", [b.razorpay_payment_id, o.id]);
  await takeStock(o.id);
  const items = JSON.parse(o.items || '[]');
  await alertShop(`New paid order ${o.code}: ${inr(o.total)}`, [
    ...items.map((i) => `${i.qty} × ${i.name}: ${inr(i.price * i.qty)}`),
    '', `Total: ${inr(o.total)} (paid online)`,
    '', `${o.name}, ${o.phone}${o.email ? ', ' + o.email : ''}`, `${o.address}, ${o.city} ${o.pincode}`,
  ]);
  return Response.json({ ok: true, code: o.code });
}
