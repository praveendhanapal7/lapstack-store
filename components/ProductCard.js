import Link from 'next/link';
import { inr } from '@/lib/format';
export default function ProductCard({ p }) {
  return (
    <Link href={`/laptops/${p.id}`} className="card">
      <div className="ph">
        {p.image ? <img src={p.image} alt={p.name} loading="lazy" /> : null}
        {p.stock < 1 ? <span className="badge out">Sold out</span> : null}
      </div>
      <div className="body">
        <h3>{p.name}</h3>
        <div className="chips">{[p.cpu, p.ram, p.storage].filter(Boolean).map((x) => <span key={x}>{x}</span>)}</div>
        {p.stock > 0 ? <small className="cardeta">🚚 2-day delivery</small> : null}
        <div className="foot"><span className="price">{inr(p.price)}</span><span className="more">View →</span></div>
      </div>
    </Link>
  );
}
