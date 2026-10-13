'use client';
import { useState } from 'react';
import { track, product } from '@/lib/pixel';
import { logEvent } from './SiteStats';
import { SLOTS } from '@/lib/enquiry';
import { BUSINESS as B } from '@/lib/business';

const today = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10); // India date

/** Replaces the cart: book a shop visit or a video call for this laptop. */
export default function BookOptions({ id, name, price, stock }) {
  const [kind, setKind] = useState(null); // 'visit' | 'video'
  if (stock < 1) return <button className="btn" disabled>Sold out</button>;
  const open = (k) => { setKind(k); logEvent('booking_open', { product_id: id, product_name: name }); };
  return (
    <>
      <div className="bookbtns">
        <button className="bookbtn dark" onClick={() => open('visit')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6" /></svg>
          Visit &amp; Purchase
        </button>
        <button className="bookbtn" onClick={() => open('video')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="13" height="12" rx="2.5" /><path d="M16 10.5l5-3v9l-5-3" /></svg>
          Order via Video Call
        </button>
      </div>
      <p className="booknote">Free · No payment now · We confirm on WhatsApp</p>
      {kind ? <BookForm kind={kind} id={id} name={name} price={price} onClose={() => setKind(null)} /> : null}
    </>
  );
}

function BookForm({ kind, id, name, price, onClose }) {
  const visit = kind === 'visit';
  const [f, setF] = useState({ name: '', email: '', city: '', phone: '', date: '', time: '', note: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const r = await fetch('/api/enquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, kind, productId: id }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Something went wrong. Please try again.');
      track('Lead', { ...product({ id, name, price }), content_category: visit ? 'Shop visit' : 'Video call' }, { eventID: d.eventId });
      setDone(true);
    } catch (x) { setErr(x.message); }
    setBusy(false);
  }

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel bookform">
        <button type="button" className="bookx" onClick={onClose} aria-label="Close">×</button>
        {done ? (
          <div>
            <div className="ok">{visit ? 'Your visit is booked!' : 'Your video call is booked!'}</div>
            <p>{visit
              ? <>We will WhatsApp you on <b>+91 {f.phone}</b> to confirm. Details are also sent to <b>{f.email}</b>.</>
              : <>We will video call you on WhatsApp at <b>+91 {f.phone}</b> at your chosen time and show you the laptop live. Details are sent to <b>{f.email}</b>.</>}
            </p>
            {visit ? (
              <div className="panel" style={{ background: '#fff' }}>
                <b>Our shop</b>
                <p className="muted small" style={{ margin: '6px 0 10px' }}>{B.address}</p>
                <a className="btn sm ghost" href={'https://maps.google.com/?q=' + encodeURIComponent(B.address)} target="_blank" rel="noreferrer">Open in Google Maps</a>
              </div>
            ) : null}
            <button className="btn" style={{ width: '100%', marginTop: 14 }} onClick={onClose}>Done</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h3>{visit ? 'Visit & Purchase' : 'Order Through Video Call'}</h3>
            <p className="muted small" style={{ marginBottom: 12 }}>{name}</p>
            {err ? <div className="err">{err}</div> : null}
            <label className="f">Your name<input required value={f.name} onChange={set('name')} /></label>
            <label className="f">Email<input required type="email" value={f.email} onChange={set('email')} /></label>
            <div className="row2">
              <label className="f">City<input required value={f.city} onChange={set('city')} placeholder="e.g. Coimbatore" /></label>
              <label className="f">WhatsApp number<input required inputMode="numeric" maxLength={14} value={f.phone} onChange={set('phone')} placeholder="10 digits" /></label>
            </div>
            <div className="row2">
              <label className="f">{visit ? 'When will you come?' : 'Best day for the call'}<input required type="date" min={today()} value={f.date} onChange={set('date')} /></label>
              <label className="f">{visit ? 'Time' : 'Best time'}
                <select required value={f.time} onChange={set('time')}>
                  <option value="">Choose…</option>
                  {SLOTS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
            </div>
            <label className="f">{visit ? 'Anything you want us to keep ready? (optional)' : 'What would you like to see on the call? (optional)'}
              <input value={f.note} onChange={set('note')} placeholder={visit ? 'e.g. compare with another model' : 'e.g. battery health, keyboard, screen'} />
            </label>
            <button className="btn" style={{ width: '100%' }} disabled={busy}>{busy ? 'Booking…' : visit ? 'Book my visit' : 'Book video call'}</button>
            <p className="muted small" style={{ marginTop: 10, textAlign: 'center' }}>Free. No payment now. We confirm on WhatsApp.</p>
          </form>
        )}
      </div>
    </div>
  );
}
