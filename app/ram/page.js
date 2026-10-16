import { listProducts } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'RAM — Lapstack', description: 'Branded RAM at honest prices. Open box, brand new.' };

export default async function Ram() {
  const rows = await listProducts({ category: 'ram' });
  return (
    <div className="wrap" style={{ padding: '40px 20px' }}>
      <h1 style={{ fontSize: 56, marginBottom: 8 }}>RAM</h1>
      <p className="muted" style={{ marginBottom: 28 }}>Branded memory at honest prices. Delivered in 2 days.</p>
      {rows.length ? <div className="grid">{rows.map((p) => <ProductCard key={p.id} p={p} />)}</div> : <p className="empty">No RAM in stock right now.</p>}
    </div>
  );
}
