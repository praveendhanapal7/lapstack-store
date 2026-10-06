import Doc from '@/components/Doc';
import Link from 'next/link';
export const metadata = { title: 'About us — Lapstack' };
export default function About() {
  return (
    <Doc title="About Lapstack">
      <p className="lead">We make good laptops easy to afford.</p>
      <p>Lapstack sells carefully tested, refurbished business-class laptops from brands like Dell, Lenovo, HP and Apple. These machines were built for demanding offices, so they are fast, durable and far cheaper than new.</p>
      <h2>What we do</h2>
      <p>Every laptop is checked for display, keyboard, battery, ports and performance before we list it. We show the real specification and an honest price, with no confusing add-ons. Many models include a warranty, clearly marked on the product page.</p>
      <h2>Buy or sell</h2>
      <p>Looking for a reliable laptop? <Link href="/laptops">Browse our collection</Link>. Have a laptop you no longer use? <Link href="/sell">Tell us about it</Link> and we will make you an offer.</p>
      <h2>Talk to us</h2>
      <p>Questions about a model or an order? Visit the <Link href="/contact">contact page</Link>.</p>
    </Doc>
  );
}
