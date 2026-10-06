import { notFound } from 'next/navigation';
import { getProduct } from '@/lib/db';
import { inr } from '@/lib/format';
import AddToCart from '@/components/AddToCart';
export const dynamic = 'force-dynamic';

export default async function Detail({ params }) {
  const { id } = await params;
  const p = await getProduct(Number(id));
  if (!p || !p.active) notFound();
  const WA = process.env.NEXT_PUBLIC_WHATSAPP || '919345145774';
  const rows = [['Processor', p.cpu], ['Memory', p.ram], ['Storage', p.storage], ['Display', p.display], ['Warranty', p.warranty ? 'Included' : 'Tested, no warranty'], ['Availability', p.stock > 0 ? `${p.stock} in stock` : 'Sold out']].filter((r) => r[1]);
  return (
    <div className="wrap">
      <div className="detail">
        <div className="ph">{p.image ? <img src={p.image} alt={p.name} /> : null}</div>
        <div>
          <div className="eyebrow">Refurbished</div>
          <h1 style={{ fontSize: 44 }}>{p.name}</h1>
          <div className="price" style={{ fontSize: 30, margin: '14px 0' }}>{inr(p.price)}</div>
          <table className="spec-table"><tbody>{rows.map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}</tbody></table>
          {p.note ? <p style={{ color: 'var(--muted)' }}>{p.note}</p> : null}
          <AddToCart id={p.id} stock={p.stock} />
          <p style={{ marginTop: 18 }}><a href={`https://wa.me/${WA}?text=${encodeURIComponent('Hi, I am interested in ' + p.name)}`} style={{ fontWeight: 700, textDecoration: 'underline' }}>Ask about this laptop on WhatsApp</a></p>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>Photo is representative of the model.</p>
        </div>
      </div>
    </div>
  );
}
