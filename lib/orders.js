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
    `SELECT * FROM orders WHERE user_id = $1 AND payment_status IN ('paid','refunded','refund_pending') ORDER BY id DESC LIMIT 50`, [userId]);
  return rows.map((o) => ({
    code: o.code, items: JSON.parse(o.items), total: o.total, payment_status: o.payment_status, order_status: o.order_status,
    created_at: o.created_at, name: o.name, address: o.address, city: o.city, pincode: o.pincode,
    cancellable: ['new', 'confirmed'].includes(o.order_status),
  }));
}

/** Customer cancels their own order before it ships. Paid orders are refunded in full to the original payment method. */
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

  let refunded = false;
  if (o.paid) {
    try {
      if (!razorpayEnabled() || !o.row.razorpay_payment_id) throw new Error('No payment to refund automatically');
      const r = await refundPayment({ paymentId: o.row.razorpay_payment_id, amountRupees: o.row.total });
      await q('UPDATE orders SET payment_status = $1, razorpay_refund_id = $2 WHERE id = $3', ['refunded', r.id, o.row.id]);
      refunded = true;
    } catch (e) {
      console.error('Refund failed for', code, e.message);
      await alertShop(`REFUND NEEDED: order ${code} cancelled`, [`${user.email} cancelled order ${code} (${inr(o.row.total)}).`, `Automatic refund failed: ${e.message}`, 'Please refund it from the Razorpay dashboard, then mark it refunded in Admin.']);
    }
  }
  const lines = JSON.parse(o.row.items).map((i) => `${i.qty} × ${i.name}`);
  await sendMail({
    to: user.email,
    subject: `Order ${code} cancelled`,
    text: `Your order ${code} has been cancelled.\n\n${lines.join('\n')}\n\n` + (o.paid
      ? (refunded ? `Your payment of ${inr(o.row.total)} is being refunded to your original payment method. It usually reaches you in 5 to 7 working days.` : `We will refund ${inr(o.row.total)} to your original payment method shortly and keep you posted.`)
      : 'No payment was taken for this order.') + '\n\nLapstack · lapstack.in',
  });
  if (!o.paid) return { ok: true, refunded: false };
  await alertShop(`Order ${code} cancelled by customer`, [`${user.email} cancelled ${code} (${inr(o.row.total)}).`, refunded ? 'Refund sent automatically.' : 'Refund still needs doing.']);
  return { ok: true, refunded };
}
