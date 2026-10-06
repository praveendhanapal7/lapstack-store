import Link from 'next/link';
import { listProducts, band } from '@/lib/db';
import { inr } from '@/lib/format';
import ProductCard from '@/components/ProductCard';
export const dynamic = 'force-dynamic';

const WA = process.env.NEXT_PUBLIC_WHATSAPP || '919345145774';

export default async function Home() {
  const all = await listProducts();
  const featured = all.filter((p) => p.stock > 0).slice(0, 6);
  const count = (b) => all.filter((p) => band(p.price) === b && p.stock > 0).length;
  // Hero photos: one clean product shot per brand (uploaded posters/banners are skipped), Lenovo in the middle.
  const photo = (b) => all.find((p) => p.stock > 0 && p.image.startsWith('/laptops/') && p.name.startsWith(b));
  const shots = ['Dell', 'Lenovo', 'HP'].map(photo).filter(Boolean);
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div>
            <div className="eyebrow">Lapstack</div>
            <h1><span className="l1">Premium refurbished laptops.</span><span className="l2">Honest prices.</span></h1>
            <p>Business-class power from Dell, Lenovo, HP and Apple. Tested, trusted, from ₹21,000.</p>
            <div className="cta">
              <Link className="btn" href="/laptops">Shop laptops</Link>
              <a className="btn ghost" href={`https://wa.me/${WA}`}>Chat on WhatsApp</a>
            </div>
          </div>
          {shots.length ? <div className="mshow">{shots.map((p) => (
            <Link key={p.id} href={`/laptops/${p.id}`} className="scard">
              <span className="pill">{p.name.split(' ')[0]}</span>
              <div className="stage"><img src={p.image} alt={p.name} /></div>
              <div className="meta"><div><b>{p.name}</b><small>{[p.ram, p.storage].filter(Boolean).join(' · ')}</small></div><span className="go">{inr(p.price)} →</span></div>
            </Link>
          ))}</div> : null}
          {shots.length ? <div className="showcase">{shots.map((p, i) => <img key={p.id} src={p.image} alt={p.name} className={'s' + i} />)}</div> : null}
        </div>
      </section>

      <section className="trust">
        <div className="wrap">
          <div><i><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></i><b>Tested</b><span>Checked before listing</span></div>
          <div><i><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6z" /></svg></i><b>Warranty</b><span>On selected models</span></div>
          <div><i><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg></i><b>Secure payment</b><span>UPI, cards, netbanking</span></div>
          <div><i><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></svg></i><b>Delivered</b><span>Across India</span></div>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="eyebrow">Shop by budget</div>
          <h2 className="title">Pick your price range</h2>
          <div className="tiers">
            <Link className="tier" href="/laptops?b=low"><h3>Up to ₹25,000</h3><p>{count('low')} laptops · everyday work</p></Link>
            <Link className="tier" href="/laptops?b=mid"><h3>₹25,001 – ₹35,000</h3><p>{count('mid')} laptops · best value</p></Link>
            <Link className="tier" href="/laptops?b=high"><h3>Above ₹35,000</h3><p>{count('high')} laptops · power users</p></Link>
          </div>
        </div>
      </section>

      <section className="block alt">
        <div className="wrap">
          <div className="eyebrow">Available now</div>
          <h2 className="title">Featured laptops</h2>
          <div className="grid">{featured.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          <p style={{ marginTop: 24 }}><Link className="btn ghost" href="/laptops">See all laptops</Link></p>
        </div>
      </section>

      <section className="block" id="how">
        <div className="wrap">
          <div className="eyebrow">How it works</div>
          <h2 className="title">Four simple steps</h2>
          <div className="steps">
            <div className="step"><h3>Choose</h3><p>Browse laptops by budget and specs.</p></div>
            <div className="step"><h3>Order</h3><p>Pay securely online.</p></div>
            <div className="step"><h3>We confirm</h3><p>We call or WhatsApp you to confirm.</p></div>
            <div className="step"><h3>Delivered</h3><p>Packed carefully and shipped to your door.</p></div>
          </div>
        </div>
      </section>

      <section className="block alt" id="faq">
        <div className="wrap" style={{ maxWidth: 780 }}>
          <div className="eyebrow">FAQ</div>
          <h2 className="title">Common questions</h2>
          <details><summary>Are the laptops tested?</summary><p>Yes. Every laptop is checked before listing. Models marked "Warranty" carry a warranty.</p></details>
          <details><summary>Are the photos exact?</summary><p>Photos are representative of the model. Ask us on WhatsApp for photos of the exact unit.</p></details>
          <details><summary>How is payment done?</summary><p>Pay online by UPI, card or netbanking. Payments are processed securely by Razorpay.</p></details>
          <details><summary>Can I sell you my laptop?</summary><p>Yes. Use the Sell page to add photos, specs, purchase date and an optional bill. We will contact you with an offer.</p></details>
          <details><summary>Can I see the laptop first?</summary><p>Yes. Message us on WhatsApp to arrange a visit.</p></details>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="sellcta">
            <div><div className="eyebrow">Sell your laptop</div><h2>Have a laptop to sell?</h2><p>Add photos and details. We review and contact you with an offer.</p></div>
            <Link className="btn" href="/sell">Get an offer</Link>
          </div>
        </div>
      </section>

      <section className="contact" id="contact">
        <div className="wrap">
          <h2>Questions? Talk to us.</h2>
          <p>WhatsApp {WA.replace(/^91/, '')} · Instagram @lapstack.in</p>
          <a className="btn ghost" href={`https://wa.me/${WA}`}>Message on WhatsApp</a>
        </div>
      </section>
    </>
  );
}
