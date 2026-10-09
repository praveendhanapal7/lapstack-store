'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from './CartProvider';
import { useAuth } from './Auth';
export default function Header() {
  const { count } = useCart();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
    <div className="shipbar">🚚 2-day delivery on every laptop</div>
    <header className="top">
      <div className="wrap">
        <Link href="/" className="brand" onClick={close}><img src="/logo.png" alt="" /><span>Lapstack</span></Link>
        <nav className="links">
          <Link href="/">Home</Link>
          <Link href="/laptops">Laptops</Link>
          <Link href="/sell">Sell</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <Link href="/account" className="acctlink" onClick={close}>{user ? 'Account' : 'Sign in'}</Link>
        <Link href="/cart" className="cartlink" onClick={close}>Cart <b>{count}</b></Link>
        <button className={'burger' + (open ? ' on' : '')} aria-label="Menu" onClick={() => setOpen(!open)}><i /><i /></button>
      </div>
      {open ? (
        <nav className="mobnav" onClick={close}>
          <Link href="/">Home</Link>
          <Link href="/laptops">Laptops</Link>
          <Link href="/sell">Sell your laptop</Link>
          <Link href="/about">About us</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/track">Track order</Link>
          <Link href="/account">{user ? 'My account & orders' : 'Sign in'}</Link>
          <Link href="/refund">Cancellation &amp; refund</Link>
        </nav>
      ) : null}
    </header>
    </>
  );
}
