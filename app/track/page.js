'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Track() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function go(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    const r = await fetch('/api/orders/lookup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, phone }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) router.push('/order/' + d.code); else { setErr(d.error || 'Something went wrong.'); setBusy(false); }
  }
  return (
    <div className="wrap" style={{ maxWidth: 480, padding: '48px 20px 80px' }}>
      <h1 style={{ fontSize: 36, marginBottom: 8 }}>Track your order</h1>
      <p className="muted" style={{ marginBottom: 20 }}>Your order number is in the confirmation email (for example LS-1A2B3C).</p>
      <form className="panel" onSubmit={go}>
        {err ? <div className="err">{err}</div> : null}
        <label className="f">Order number<input required value={code} placeholder="LS-1A2B3C" onChange={(e) => setCode(e.target.value)} /></label>
        <label className="f">Phone used for the order<input required inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
        <button className="btn" style={{ width: '100%' }} disabled={busy}>{busy ? 'Checking…' : 'Track order'}</button>
      </form>
    </div>
  );
}
