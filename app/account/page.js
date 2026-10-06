'use client';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useAuth, SignIn } from '@/components/Auth';
import { useCart } from '@/components/CartProvider';
import { inr } from '@/lib/format';
import { BUSINESS as B } from '@/lib/business';

const api = async (url, method, body) => {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Something went wrong.');
  return d;
};
const when = (t) => { try { return new Date(t.replace(' ', 'T') + 'Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ''; } };
const STATUS = { new: 'Order received', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' };
// Call / chat buttons so customers can reach a person about an order or refund.
function Help({ code, label = 'Need help?' }) {
  const tel = 'tel:+' + B.whatsapp;
  const wa = `https://wa.me/${B.whatsapp}?text=${encodeURIComponent(code ? `Hi, I need help with my order ${code}` : 'Hi, I need help with my order')}`;
  return (
    <div className="helpbar">
      <span>{label}</span>
      <a className="btn ghost sm" href={tel}>Call customer care</a>
      <a className="btn sm" href={wa} target="_blank" rel="noopener">Chat with an agent</a>
    </div>
  );
}
const blank = { name: '', phone: '', address: '', city: '', pincode: '' };

export default function Account() {
  const { user, addresses, refresh, logout } = useAuth();
  const [tab, setTab] = useState('orders');
  if (user === undefined) return <div className="wrap empty"><p>Loading…</p></div>;
  if (!user) return (
    <div className="wrap" style={{ padding: '40px 20px', maxWidth: 520 }}>
      <h1 style={{ fontSize: 34, marginBottom: 16 }}>My account</h1>
      <SignIn title="Sign in" note="See your orders, cancel an order, and keep your cart and addresses saved. New here? Just enter your email; your account is created automatically." />
    </div>
  );
  const tabs = [['orders', 'Orders'], ['cart', 'Cart'], ['addresses', 'Addresses'], ['profile', 'Profile']];
  return (
    <div className="wrap" style={{ padding: '36px 20px', maxWidth: 820 }}>
      <h1 style={{ fontSize: 34 }}>My account</h1>
      <p className="muted" style={{ margin: '4px 0 18px' }}>{user.name ? `${user.name} · ` : ''}{user.email}</p>
      <div className="tabs">{tabs.map(([k, t]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t}</button>)}</div>
      {tab === 'orders' ? <Orders /> : null}
      {tab === 'cart' ? <CartTab /> : null}
      {tab === 'addresses' ? <Addresses addresses={addresses} refresh={refresh} /> : null}
      {tab === 'profile' ? <Profile user={user} refresh={refresh} logout={logout} /> : null}
    </div>
  );
}

function Orders() {
  const [orders, setOrders] = useState(null);
  const [msg, setMsg] = useState('');
  const load = useCallback(() => api('/api/me/orders', 'GET').then((d) => setOrders(d.orders)).catch((e) => setMsg(e.message)), []);
  useEffect(() => { load(); }, [load]);
  async function cancel(o) {
    if (!confirm(`Cancel order ${o.code}?` + (o.payment_status === 'paid' ? ` Your ${inr(o.total)} will be refunded to your original payment method once we approve it.` : ''))) return;
    setMsg('');
    try {
      const r = await api(`/api/me/orders/${o.code}/cancel`, 'POST');
      setMsg(r.refundPending ? `Order ${o.code} cancelled. We will approve your refund shortly and email you when it is sent.` : `Order ${o.code} cancelled.`);
      load();
    } catch (e) { setMsg(e.message); }
  }
  if (!orders) return <p className="muted">{msg || 'Loading your orders…'}</p>;
  return (
    <div>
      {msg ? <div className="ok" style={{ marginBottom: 14 }}>{msg}<Help label="Questions about your cancellation or refund?" /></div> : null}
      {!orders.length ? <div className="panel"><p>You have no orders yet.</p><Link className="btn" href="/laptops">Browse laptops</Link></div> : null}
      {orders.map((o) => (
        <div className="panel ordercard" key={o.code}>
          <div className="ohead">
            <div><b>Order {o.code}</b><span className="muted small"> · {when(o.created_at)}</span></div>
            <span className={'chip ' + o.order_status}>{STATUS[o.order_status] || o.order_status}</span>
          </div>
          {o.items.map((i) => <div className="sum" key={i.id}><span>{i.name} × {i.qty}</span><span>{inr(i.price * i.qty)}</span></div>)}
          <div className="sum t"><span>Total</span><span>{inr(o.total)}</span></div>
          <p className="muted small">Deliver to {o.name}, {o.address}, {o.city} {o.pincode}</p>
          {o.payment_status === 'refunded' ? <p className="small" style={{ color: '#1a7f37' }}>Refunded: {inr(o.total)} sent back to your payment method.</p> : null}
          {o.payment_status === 'refunding' ? <p className="small" style={{ color: '#b45309' }}>Refund is being sent.</p> : null}
          {o.payment_status === 'refund_pending' ? <p className="small" style={{ color: '#b45309' }}>Refund waiting for our approval. We will email you when it is sent.</p> : null}
          <div className="oacts">
            <Link className="btn ghost sm" href={'/order/' + o.code}>View</Link>
            {o.cancellable ? <button className="btn ghost sm danger" onClick={() => cancel(o)}>Cancel order</button> : o.order_status === 'shipped' ? <span className="muted small">Shipped orders cannot be cancelled. Please contact us.</span> : null}
          </div>
          <Help code={o.code} />
        </div>
      ))}
    </div>
  );
}

function CartTab() {
  const { items, setQty, remove, ready } = useCart();
  const [info, setInfo] = useState({});
  useEffect(() => {
    if (!ready || !items.length) return;
    fetch('/api/products?ids=' + items.map((i) => i.id).join(',')).then((r) => r.json()).then((rows) => { const m = {}; rows.forEach((r) => (m[r.id] = r)); setInfo(m); });
  }, [ready, items.length]); // eslint-disable-line
  const lines = items.map((i) => ({ ...i, p: info[i.id] })).filter((l) => l.p);
  const total = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  if (!items.length) return <div className="panel"><p>Your cart is empty.</p><Link className="btn" href="/laptops">Browse laptops</Link></div>;
  return (
    <div className="panel">
      {lines.map((l) => (
        <div className="sum" key={l.id}>
          <span><Link href={'/laptops/' + l.id}>{l.p.name}</Link> × {l.qty}{l.p.stock < 1 ? <b style={{ color: '#b91c1c' }}> (sold out)</b> : null}</span>
          <span>{inr(l.p.price * l.qty)} <button className="linkbtn" onClick={() => remove(l.id)}>Remove</button></span>
        </div>
      ))}
      <div className="sum t"><span>Total</span><span>{inr(total)}</span></div>
      <Link className="btn" style={{ marginTop: 14 }} href="/checkout">Checkout</Link>
    </div>
  );
}

function Addresses({ addresses, refresh }) {
  const [f, setF] = useState(null); // null = closed; {id?, ...fields}
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function save(e) {
    e.preventDefault(); setErr('');
    try { f.id ? await api('/api/me/addresses/' + f.id, 'PATCH', f) : await api('/api/me/addresses', 'POST', f); setF(null); refresh(); }
    catch (x) { setErr(x.message); }
  }
  const act = async (fn) => { try { await fn(); refresh(); } catch (x) { setErr(x.message); } };
  return (
    <div>
      {err && !f ? <div className="err">{err}</div> : null}
      {addresses.map((a) => (
        <div className="panel addrcard" key={a.id}>
          <div><b>{a.name}</b> · {a.phone} {a.is_default ? <span className="chip confirmed">Default</span> : null}</div>
          <p className="muted">{a.address}, {a.city} {a.pincode}</p>
          <div className="oacts">
            <button className="btn ghost sm" onClick={() => { setErr(''); setF({ ...a }); }}>Edit</button>
            {!a.is_default ? <button className="btn ghost sm" onClick={() => act(() => api('/api/me/addresses/' + a.id, 'PATCH', { make_default: true }))}>Make default</button> : null}
            <button className="btn ghost sm danger" onClick={() => confirm('Delete this address?') && act(() => api('/api/me/addresses/' + a.id, 'DELETE'))}>Delete</button>
          </div>
        </div>
      ))}
      {!addresses.length && !f ? <div className="panel"><p>No saved addresses yet. Add one now, or tick "Save this address" at checkout.</p></div> : null}
      {f ? (
        <form className="panel" onSubmit={save}>
          <h3 style={{ marginBottom: 12 }}>{f.id ? 'Edit address' : 'New address'}</h3>
          {err ? <div className="err">{err}</div> : null}
          <label className="f">Full name<input required value={f.name} onChange={set('name')} /></label>
          <label className="f">Phone (10 digits)<input required inputMode="numeric" value={f.phone} onChange={set('phone')} /></label>
          <label className="f">Address<textarea required rows={3} value={f.address} onChange={set('address')} /></label>
          <div className="row2">
            <label className="f">City<input required value={f.city} onChange={set('city')} /></label>
            <label className="f">Pincode<input required inputMode="numeric" maxLength={6} value={f.pincode} onChange={set('pincode')} /></label>
          </div>
          <div className="oacts"><button className="btn">Save address</button><button type="button" className="btn ghost" onClick={() => setF(null)}>Cancel</button></div>
        </form>
      ) : <button className="btn" onClick={() => { setErr(''); setF({ ...blank }); }}>+ Add address</button>}
    </div>
  );
}

function Profile({ user, refresh, logout }) {
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  async function save(e) {
    e.preventDefault(); setMsg(''); setErr('');
    try { await api('/api/me', 'PATCH', { name, phone }); await refresh(); setMsg('Saved.'); } catch (x) { setErr(x.message); }
  }
  return (
    <form className="panel" onSubmit={save}>
      {msg ? <div className="ok">{msg}</div> : null}{err ? <div className="err">{err}</div> : null}
      <label className="f">Email<input value={user.email} disabled /></label>
      <label className="f">Name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label className="f">Phone (10 digits)<input inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
      <div className="oacts"><button className="btn">Save</button><button type="button" className="btn ghost" onClick={logout}>Sign out</button></div>
    </form>
  );
}
