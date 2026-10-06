'use client';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from '@/components/CartProvider';
import { useAuth, SignIn } from '@/components/Auth';
import { inr } from '@/lib/format';

export default function Checkout() {
  const { items, clear, ready } = useCart();
  const router = useRouter();
  const { user, addresses, refresh } = useAuth();
  const [pick, setPick] = useState('new'); // saved address id, or 'new'
  const [save, setSave] = useState(true);
  const [info, setInfo] = useState({});
  const [cfg, setCfg] = useState({ razorpay: false });
  const [f, setF] = useState({ name: '', phone: '', address: '', city: '', pincode: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    fetch('/api/config').then((r) => r.json()).then((c) => { setCfg(c); });
  }, []);
  useEffect(() => {
    if (!user) return;
    const def = addresses.find((a) => a.is_default) || addresses[0];
    if (def) { setPick(String(def.id)); setF({ name: def.name, phone: def.phone, address: def.address, city: def.city, pincode: def.pincode }); }
    else setF((c) => ({ ...c, name: c.name || user.name || '', phone: c.phone || user.phone || '' }));
  }, [user?.id, addresses.length]); // eslint-disable-line
  function choose(id) {
    setPick(id);
    if (id === 'new') { setF({ name: user.name || '', phone: user.phone || '', address: '', city: '', pincode: '' }); return; }
    const a = addresses.find((x) => String(x.id) === id);
    if (a) setF({ name: a.name, phone: a.phone, address: a.address, city: a.city, pincode: a.pincode });
  }
  useEffect(() => {
    if (!ready || !items.length) return;
    fetch('/api/products?ids=' + items.map((i) => i.id).join(',')).then((r) => r.json()).then((rows) => {
      const m = {}; rows.forEach((r) => (m[r.id] = r)); setInfo(m);
    });
  }, [ready, items.length]); // eslint-disable-line
  const lines = items.map((i) => ({ ...i, p: info[i.id] })).filter((l) => l.p);
  const total = lines.reduce((s, l) => s + l.p.price * l.qty, 0);

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer: f, items, saveAddress: pick === 'new' && save }) });
      const d = await res.json();
      if (res.status === 401) { await refresh(); throw new Error('Your sign-in expired. Please sign in again.'); }
      if (!res.ok) throw new Error(d.error || 'Something went wrong');
      if (!window.Razorpay) throw new Error('Payment window failed to load. Check your internet and retry.');
      const z = d.razorpay;
      const rz = new window.Razorpay({
        key: z.keyId, amount: z.amount, currency: 'INR', name: 'Lapstack', description: 'Order ' + d.code, order_id: z.orderId,
        prefill: { name: z.name, contact: z.phone, email: user.email }, theme: { color: '#FDC500' },
        handler: async (r) => {
          const v = await fetch('/api/payments/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: d.code, razorpay_order_id: r.razorpay_order_id, razorpay_payment_id: r.razorpay_payment_id, razorpay_signature: r.razorpay_signature }) });
          if (v.ok) { clear(); refresh(); router.push('/order/' + d.code); }
          else { setErr('Payment could not be verified. If money was deducted, WhatsApp us with order ' + d.code); setBusy(false); }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rz.on('payment.failed', (r) => { setErr(r.error?.description || 'Payment failed. Try again.'); setBusy(false); });
      rz.open();
    } catch (x) { setErr(x.message); setBusy(false); }
  }

  if (ready && !items.length) return <div className="wrap empty"><p>Your cart is empty.</p><Link className="btn" href="/laptops">Browse laptops</Link></div>;
  if (user === undefined) return <div className="wrap empty"><p>Loading…</p></div>;
  const steps = (n) => (
    <ol className="steps">
      {['Sign in', 'Delivery', 'Pay'].map((t, i) => <li key={t} className={i + 1 < n ? 'done' : i + 1 === n ? 'now' : ''}><i>{i + 1 < n ? '✓' : i + 1}</i>{t}</li>)}
    </ol>
  );
  if (!user) return (
    <div className="wrap" style={{ padding: '36px 20px', maxWidth: 520 }}>
      <h1 style={{ fontSize: 36, marginBottom: 16 }}>Checkout</h1>
      {steps(1)}
      <SignIn title="Sign in to place your order" note="Confirm your email once. Then you can track, cancel and re-order from your account, and your address is saved for next time." />
      <p className="muted small" style={{ textAlign: 'center', marginTop: 14 }}>Your cart is saved: {lines.length ? lines.map((l) => l.p.name).join(', ') : 'nothing yet'}.</p>
    </div>
  );
  return (
    <div className="wrap" style={{ padding: '36px 20px' }}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <h1 style={{ fontSize: 36, marginBottom: 16 }}>Checkout</h1>
      {steps(2)}
      <form className="two" style={{ padding: 0 }} onSubmit={submit}>
        <div className="panel">
          <h3 style={{ marginBottom: 6 }}>Delivery details</h3>
          <p className="muted small" style={{ marginBottom: 14 }}>Signed in as <b>{user.email}</b>. Order updates go to this email.</p>
          {err ? <div className="err">{err}</div> : null}
          {addresses.length ? (
            <div className="addrpick">
              {addresses.map((a) => (
                <label key={a.id} className={'addropt' + (pick === String(a.id) ? ' on' : '')}>
                  <input type="radio" name="addr" checked={pick === String(a.id)} onChange={() => choose(String(a.id))} />
                  <span><b>{a.name}</b> · {a.phone}<br />{a.address}, {a.city} {a.pincode}</span>
                </label>
              ))}
              <label className={'addropt' + (pick === 'new' ? ' on' : '')}>
                <input type="radio" name="addr" checked={pick === 'new'} onChange={() => choose('new')} />
                <span><b>+ Use a new address</b></span>
              </label>
            </div>
          ) : null}
          <label className="f">Full name<input required value={f.name} onChange={set('name')} /></label>
          <label className="f">Phone (10 digits)<input required inputMode="numeric" value={f.phone} onChange={set('phone')} /></label>
          <label className="f">Address<textarea required rows={3} value={f.address} onChange={set('address')} /></label>
          <div className="row2">
            <label className="f">City<input required value={f.city} onChange={set('city')} /></label>
            <label className="f">Pincode<input required inputMode="numeric" maxLength={6} value={f.pincode} onChange={set('pincode')} /></label>
          </div>
          {pick === 'new' ? <label className="check"><input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} /> Save this address to my account</label> : null}
        </div>
        <div className="panel">
          <h3>Payment</h3>
          <div className="securepay"><b>Secure online payment</b><span>UPI, cards and netbanking via Razorpay</span></div>
          {!cfg.razorpay ? <div className="err">Online payment is not switched on yet. Add Razorpay keys to enable checkout.</div> : null}
          {lines.map((l) => <div className="sum" key={l.id}><span>{l.p.name} × {l.qty}</span><span>{inr(l.p.price * l.qty)}</span></div>)}
          <div className="sum t"><span>Total</span><span>{inr(total)}</span></div>
          <button className="btn" style={{ width: '100%', marginTop: 14 }} disabled={busy || !lines.length || !cfg.razorpay}>{busy ? 'Please wait…' : 'Pay ' + inr(total)}</button>
        </div>
      </form>
    </div>
  );
}
