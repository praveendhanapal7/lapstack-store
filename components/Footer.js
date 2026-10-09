import Link from 'next/link';
import { BUSINESS as B } from '@/lib/business';
export default function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="fcols">
          <div><b className="fbrand">Lapstack</b><p>Premium refurbished laptops. Tested, honestly priced.</p></div>
          <div><h4>Shop</h4><Link href="/laptops">All laptops</Link><Link href="/sell">Sell your laptop</Link><Link href="/cart">Cart</Link><Link href="/track">Track order</Link></div>
          <div><h4>Company</h4><Link href="/about">About us</Link><Link href="/contact">Contact us</Link></div>
          <div><h4>Policies</h4><Link href="/warranty">Warranty policy</Link><Link href="/refund">Cancellation &amp; refund</Link><Link href="/shipping">Shipping policy</Link><Link href="/privacy">Privacy policy</Link><Link href="/terms">Terms &amp; conditions</Link></div>
        </div>
        <div className="fbase"><span>© {new Date().getFullYear()} {B.legalName}. All rights reserved.</span><span>Instagram @{B.instagram} · {B.email}</span></div>
      </div>
    </footer>
  );
}
