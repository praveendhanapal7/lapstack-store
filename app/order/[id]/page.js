import { notFound } from 'next/navigation';
import { getOrderByCode } from '@/lib/orders';
import { inr } from '@/lib/format';
import OrderAccount from '@/components/OrderAccount';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your order — Lapstack' };

const STEPS = [['paid', 'Payment received'], ['confirmed', 'Confirmed'], ['shipped', 'Shipped'], ['delivered', 'Delivered']];

// Hide most of the email: this page is opened by order number only.
const mask = (e) => e.replace(/^(.{2})[^@]*(@.*)$/, (m, a, b) => a + '****' + b);

export default async function OrderPage({ params }) {
  const { id } = await params;
  const o = await getOrderByCode(id);
  if (!o) notFound();
  const WA = process.env.NEXT_PUBLIC_WHATSAPP || '919345145774';
  const paid = ['paid', 'refund_pending', 'refunding', 'refunded'].includes(o.payment_status);
  const cancelled = o.order_status === 'cancelled';
  // How far along the order is: 1 = paid, 2 = confirmed, 3 = shipped, 4 = delivered.
  const at = !paid ? 0 : { new: 1, confirmed: 2, shipped: 3, delivered: 4 }[o.order_status] || 1;
  const note = cancelled
    ? (o.payment_status === 'refunded' ? 'This order was cancelled and the money has been refunded.' : 'This order was cancelled. Your refund is being processed.')
    : !paid ? 'Payment not completed. If money was deducted, WhatsApp us with your order number.'
    : at === 4 ? 'Delivered. Enjoy your laptop!' : at === 3 ? 'On the way. It should reach you within 2 days.' : 'We are getting your laptop ready. Delivery in 2 days.';
  return (
    <div className="wrap" style={{ maxWidth: 680, padding: '48px 20px 80px' }}>
      <div className={cancelled || !paid ? 'err' : 'ok'}>{note}</div>
      <h1 style={{ fontSize: 34 }}>Order {o.code}</h1>
      {paid && o.email ? <p className="sentnote">📧 Order details were sent to <b>{mask(o.email)}</b>. Check your inbox (and spam).</p> : null}
      {paid && !cancelled ? (
        <ol className="otrack">
          {STEPS.map(([k, label], i) => <li key={k} className={i + 1 <= at ? 'done' : ''}><i>{i + 1 <= at ? '✓' : i + 1}</i>{label}</li>)}
        </ol>
      ) : null}
      <div className="panel" style={{ margin: '20px 0' }}>
        {o.items.map((i) => <div className="sum" key={i.id}><span>{i.name} × {i.qty}</span><span>{inr(i.price * i.qty)}</span></div>)}
        <div className="sum t"><span>Total</span><span>{inr(o.total)}</span></div>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Delivering to {o.name}, {o.city} {o.pincode}</p>
      </div>
      {paid ? <OrderAccount email={mask(o.email || '')} /> : null}
      <p className="muted small">Bookmark this page to check your order any time, or use <a href="/track" style={{ textDecoration: 'underline' }}>Track order</a> with your order number and phone. To cancel before it ships, <a href="/account" style={{ textDecoration: 'underline' }}>sign in</a> with the email you used.</p>
      <a className="btn" href={`https://wa.me/${WA}?text=${encodeURIComponent('Hi, my order is ' + o.code)}`}>Message us on WhatsApp</a>
    </div>
  );
}
