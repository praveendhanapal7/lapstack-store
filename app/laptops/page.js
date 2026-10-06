import Link from 'next/link';
import { listProducts, band } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Laptops — Lapstack' };

const TABS = [['', 'All'], ['low', 'Up to ₹25,000'], ['mid', '₹25,001–35,000'], ['high', 'Above ₹35,000']];

export default async function Laptops({ searchParams }) {
  const sp = await searchParams;
  const b = ['low', 'mid', 'high'].includes(sp?.b) ? sp.b : '';
  const rows = (await listProducts()).filter((p) => !b || band(p.price) === b);
  return (
    <div className="wrap" style={{ padding: '40px 20px' }}>
      <h1 style={{ fontSize: 56, marginBottom: 28 }}>Laptops</h1>
      <div className="filters">
        {TABS.map(([k, label]) => (
          <Link key={k} href={k ? `/laptops?b=${k}` : '/laptops'} className={'chip' + (k === b ? ' on' : '')}>{label}</Link>
        ))}
      </div>
      {rows.length ? <div className="grid">{rows.map((p) => <ProductCard key={p.id} p={p} />)}</div> : <p className="empty">No laptops in this range right now.</p>}
    </div>
  );
}
