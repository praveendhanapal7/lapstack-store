'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from './CartProvider';
import { track, product } from '@/lib/pixel';
export default function AddToCart({ id, stock, name, price }) {
  const { add } = useCart();
  const router = useRouter();
  const [done, setDone] = useState(false);
  if (stock < 1) return <button className="btn" disabled>Sold out</button>;
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      <button className="btn ghost" onClick={() => { add(id, 1, stock); setDone(true); track('AddToCart', product({ id, name, price })); }}>{done ? 'Added ✓' : 'Add to cart'}</button>
      <button className="btn" onClick={() => { add(id, 1, stock); track('AddToCart', product({ id, name, price })); router.push('/cart'); }}>Buy now</button>
    </div>
  );
}
