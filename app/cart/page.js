'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/components/CartProvider';
import { inr } from '@/lib/format';

export default function Cart() {
  const { items, setQty, remove, ready } = useCart();
  const [info, setInfo] = useState({});
  useEffect(() => {
    if (!ready || !items.length) return;
    fetch('/api/products?ids=' + items.map((i) => i.id).join(',')).then((r) => r.json()).then((rows) => {
      const m = {}; rows.forEach((r) => (m[r.id] = r)); setInfo(m);
    });
  }, [ready, items.length]); // eslint-disable-line
  const lines = items.map((i) => ({ ...i, p: info[i.id] })).filter((l) => l.p && l.p.active);
  const total = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  const problem = lines.some((l) => l.p.stock < l.qty);

  return (
    <div className="wrap" style={{ padding: '36px 20px' }}>
      <h1 style={{ fontSize: 36, marginBottom: 20 }}>Your cart</h1>
      {!ready ? null : !items.length ? (
        <div className="empty"><p>Your cart is empty.</p><Link className="btn" href="/laptops">Browse laptops</Link></div>
      ) : (
        <div className="two" style={{ padding: 0 }}>
          <div className="panel">
            {lines.map((l) => (
              <div className="cart-row" key={l.id}>
                {l.p.image ? <img src={l.p.image} alt="" /> : <span />}
                <div>
                  <Link href={`/laptops/${l.id}`} style={{ fontWeight: 700 }}>{l.p.name}</Link>
                  <div>{inr(l.p.price)}</div>
                  {l.p.stock < l.qty ? <div style={{ color: 'var(--red)', fontSize: 13 }}>Only {l.p.stock} left</div> : null}
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div className="qty">
                    <button onClick={() => setQty(l.id, Math.max(1, l.qty - 1))}>−</button><span>{l.qty}</span>
                    <button onClick={() => setQty(l.id, Math.min(l.p.stock || 1, l.qty + 1))}>+</button>
                  </div>
                  <button className="btn sm ghost" onClick={() => remove(l.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          <div className="panel">
            <h3 style={{ marginBottom: 10 }}>Summary</h3>
            <div className="sum t"><span>Total</span><span>{inr(total)}</span></div>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Delivery details are taken at checkout.</p>
            {problem ? <div className="err">Reduce quantity of sold-out items to continue.</div> : null}
            <Link href="/checkout" className="btn" style={{ width: '100%', pointerEvents: problem ? 'none' : 'auto', opacity: problem ? .5 : 1 }}>Checkout</Link>
          </div>
        </div>
      )}
    </div>
  );
}
