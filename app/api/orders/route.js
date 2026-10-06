import { q, one, getProduct } from '@/lib/db';
import { newCode } from '@/lib/orders';
import { createRazorpayOrder, razorpayEnabled } from '@/lib/razorpay';
import { getUser } from '@/lib/customer';

export const dynamic = 'force-dynamic';
const bad = (error, status = 400) => Response.json({ error }, { status });

export async function POST(req) {
  const user = await getUser();
  if (!user) return bad('Please sign in to place your order.', 401);
  let body;
  try { body = await req.json(); } catch { return bad('Invalid request'); }
  const c = body.customer || {};
  const name = String(c.name || '').trim();
  const phone = String(c.phone || '').replace(/\D/g, '').slice(-10);
  const email = user.email;
  const address = String(c.address || '').trim();
  const city = String(c.city || '').trim();
  const pincode = String(c.pincode || '').trim();
  const method = 'razorpay';

  if (name.length < 2) return bad('Please enter your name.');
  if (phone.length !== 10) return bad('Please enter a 10 digit phone number.');
  if (address.length < 5) return bad('Please enter your full address.');
  if (!city) return bad('Please enter your city.');
  if (!/^\d{6}$/.test(pincode)) return bad('Please enter a 6 digit pincode.');
  if (!Array.isArray(body.items) || body.items.length === 0) return bad('Your cart is empty.');
  if (!razorpayEnabled()) return bad('Online payment is not available right now. Please try again later or WhatsApp us.');

  // Prices and stock always come from the database, never from the browser.
  const lines = [];
  let total = 0;
  for (const it of body.items) {
    const p = await getProduct(Number(it.id));
    const qty = Math.max(1, Math.min(10, parseInt(it.qty, 10) || 1));
    if (!p || !p.active) return bad('A laptop in your cart is no longer available.');
    if (p.stock < qty) return bad(`${p.name} has only ${p.stock} left.`);
    lines.push({ id: p.id, name: p.name, price: p.price, qty, image: p.image });
    total += p.price * qty;
  }

  const code = newCode();
  const ins = await one(`INSERT INTO orders (code,name,phone,email,address,city,pincode,items,total,method,payment_status,user_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending',$11) RETURNING id`,
    [code, name, phone, email, address, city, pincode, JSON.stringify(lines), total, method, user.id]);
  if (body.saveAddress) {
    // Keep the delivery address (and name/phone) in the customer's profile.
    const dup = await one('SELECT id FROM addresses WHERE user_id=$1 AND address=$2 AND pincode=$3', [user.id, address, pincode]);
    const n = await one('SELECT COUNT(*)::int AS c FROM addresses WHERE user_id=$1', [user.id]);
    if (!dup && n.c < 10) await q('INSERT INTO addresses (user_id,name,phone,address,city,pincode,is_default) VALUES ($1,$2,$3,$4,$5,$6,$7)', [user.id, name, phone, address, city, pincode, n.c === 0 ? 1 : 0]);
    if (!user.name || !user.phone) await q("UPDATE users SET name = CASE WHEN name = '' THEN $1 ELSE name END, phone = CASE WHEN phone = '' THEN $2 ELSE phone END WHERE id = $3", [name, phone, user.id]);
  }
  const orderId = ins.id;

  try {
    const rz = await createRazorpayOrder({ amountRupees: total, receipt: code });
    await q('UPDATE orders SET razorpay_order_id = $1 WHERE id = $2', [rz.id, orderId]);
    return Response.json({
      code, method,
      razorpay: { keyId: process.env.RAZORPAY_KEY_ID, orderId: rz.id, amount: rz.amount, name, phone, email },
    });
  } catch (e) {
    await q("UPDATE orders SET payment_status = 'failed' WHERE id = $1", [orderId]);
    return bad(e.message || 'Could not start payment.', 502);
  }
}
