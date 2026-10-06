import crypto from 'node:crypto';
import { tx, one, q } from './db';
import { refundPayment, razorpayEnabled } from './razorpay';
import { sendMail } from './mail';
import { alertShop } from './notify';
import { inr } from './format';

export { inr } from './format';

export function newCode() {
  return 'LS-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

/** Reduce stock once per order (safe to call twice). */
export async function takeStock(orderId) {
  await tx(async (db) => {
    const [o] = await db('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [orderId]);
    if (!o || o.stock_taken) return;
    for (const i of JSON.parse(o.items)) await db('UPDATE products SET stock = GREATEST(stock - $1, 0) WHERE id = $2', [i.qty, i.id]);
    await db('UPDATE orders SET stock_taken = 1 WHERE id = $1', [orderId]);
  });
}

export async function getOrderByCode(code) {
  const o = await one('SELECT * FROM orders WHERE code = $1', [code]);
  return o ? { ...o, items: JSON.parse(o.items) } : null;
}

export async function listOrdersForUser(userId) {
  // Unpaid, abandoned checkouts are not shown.
  const rows = await q(
    `SELECT * FROM orders WHERE user_id = $1 AND payment_status IN ('paid','refunded','refund_pending','refunding') ORDER BY id DESC LIMIT 50`, [userId]);
  return rows.map((o) => ({
    code: o.code, items: JSON.parse(o.items), total: o.total, payment_status: o.payment_status, order_status: o.order_status,
    created_at: o.created_at, name: o.name, address: o.address, city: o.city, pincode: o.pincode,
    cancellable: ['new', 'confirmed'].includes(o.order_status),
  }));
}

/** Customer cancels their own order before it ships. Paid orders become refund_pending until the admin approves the refund. */
export async function cancelCustomerOrder(user, code) {
  const o = await tx(async (db) => {
    const [row] = await db('SELECT * FROM orders WHERE code = $1 AND user_id = $2 FOR UPDATE', [code, user.id]);
    if (!row) return { error: 'Order not found.', status: 404 };
    if (row.order_status === 'cancelled') return { error: 'This order is already cancelled.', status: 409 };
    if (!['new', 'confirmed'].includes(row.order_status)) return { error: 'This order has already been shipped, so it cannot be cancelled. Please message us on WhatsApp.', status: 409 };
    const paid = row.payment_status === 'paid';
    await db('UPDATE orders SET order_status = $1, payment_status = $2 WHERE id = $3', ['cancelled', paid ? 'refund_pending' : row.payment_status, row.id]);
    if (row.stock_taken) {
      for (const i of JSON.parse(row.items)) await db('UPDATE products SET stock = stock + $1 WHERE id = $2', [i.qty, i.id]);
      await db('UPDATE orders SET stock_taken = 0 WHERE id = $1', [row.id]);
    }
    return { row, paid };
  });
  if (o.error) return o;

  const lines = JSON.parse(o.row.items).map((i) => `${i.qty} × ${i.name}`);
  await sendMail({
    to: user.email,
    subject: `Order ${code} cancelled`,
    text: `Your order ${code} has been cancelled.\n\n${lines.join('\n')}\n\n` + (o.paid
      ? `Your payment of ${inr(o.row.total)} will be refunded to your original payment method once we approve it. We will email you as soon as it is sent. It then usually reaches you in 5 to 7 working days.`
      : 'No payment was taken for this order.') + '\n\nLapstack · lapstack.in',
  });
  if (!o.paid) return { ok: true, refundPending: false };
  await alertShop(`Refund approval needed: order ${code}`, [`${user.email} cancelled order ${code} (${inr(o.row.total)}).`, 'The laptop is back in stock. Open Admin > Payments and click "Approve refund" to send the money back.', 'https://lapstack.in/admin']);
  return { ok: true, refundPending: true };
}

/** Admin approves a pending refund: sends the full amount back through Razorpay and tells the customer. */
export async function approveRefund(orderId) {
  const o = await one('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (!o) return { error: 'Order not found.', status: 404 };
  if (o.payment_status !== 'refund_pending') return { error: 'This order has no refund waiting for approval.', status: 409 };
  if (!razorpayEnabled() || !o.razorpay_payment_id) return { error: 'No Razorpay payment found for this order. Refund it in the Razorpay dashboard, then set the status to refunded.', status: 400 };
  // Claim it first so a double click cannot refund twice.
  const claimed = await one("UPDATE orders SET payment_status = 'refunding' WHERE id = $1 AND payment_status = 'refund_pending' RETURNING id", [orderId]);
  if (!claimed) return { error: 'This refund is already being processed.', status: 409 };
  try {
    const r = await refundPayment({ paymentId: o.razorpay_payment_id, amountRupees: o.total });
    await q('UPDATE orders SET payment_status = $1, razorpay_refund_id = $2 WHERE id = $3', ['refunded', r.id, orderId]);
  } catch (e) {
    await q("UPDATE orders SET payment_status = 'refund_pending' WHERE id = $1", [orderId]);
    return { error: 'Razorpay could not refund: ' + e.message, status: 502 };
  }
  if (o.email) await sendMail({
    to: o.email,
    subject: `Refund sent for order ${o.code}`,
    text: `Your refund of ${inr(o.total)} for order ${o.code} has been sent to your original payment method. It usually reaches you in 5 to 7 working days.\n\nLapstack · lapstack.in`,
  });
  return { ok: true };
}
