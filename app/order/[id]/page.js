import { notFound } from 'next/navigation';
import { getOrderByCode } from '@/lib/orders';
import { inr } from '@/lib/format';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Order placed — Lapstack' };

export default async function OrderPage({ params }) {
  const { id } = await params;
  const o = await getOrderByCode(id);
  if (!o) notFound();
  const WA = process.env.NEXT_PUBLIC_WHATSAPP || '919345145774';
  const paid = o.payment_status === 'paid';
  return (
    <div className="wrap" style={{ maxWidth: 680, padding: '48px 20px' }}>
      <div className="ok">{paid ? 'Payment received. Thank you!' : 'Order created. Payment pending.'}</div>
      <h1 style={{ fontSize: 34 }}>Order {o.code}</h1>
      <div className="panel" style={{ margin: '20px 0' }}>
        {o.items.map((i) => <div className="sum" key={i.id}><span>{i.name} × {i.qty}</span><span>{inr(i.price * i.qty)}</span></div>)}
        <div className="sum t"><span>Total</span><span>{inr(o.total)}</span></div>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Delivering to {o.name}, {o.address}, {o.city} {o.pincode}</p>
      </div>
      <p>We will call or WhatsApp you on {o.phone} to confirm.</p>
      <p><a className="linkbtn" href="/account">View or cancel this order in my account</a></p>
      <a className="btn" href={`https://wa.me/${WA}?text=${encodeURIComponent('Hi, my order is ' + o.code)}`}>Message us on WhatsApp</a>
    </div>
  );
}
