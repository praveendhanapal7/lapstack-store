'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from './CartProvider';
export default function AddToCart({ id, stock }) {
  const { add } = useCart();
  const router = useRouter();
  const [done, setDone] = useState(false);
  if (stock < 1) return <button className="btn" disabled>Sold out</button>;
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      <button className="btn ghost" onClick={() => { add(id, 1, stock); setDone(true); }}>{done ? 'Added ✓' : 'Add to cart'}</button>
      <button className="btn" onClick={() => { add(id, 1, stock); router.push('/cart'); }}>Buy now</button>
    </div>
  );
}
