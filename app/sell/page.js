'use client';
import { useState } from 'react';
import { upload } from '@vercel/blob/client';

const safe = (n) => n.replace(/[^\w.-]+/g, '_').slice(-60);
// Shrink big phone photos before upload.
async function shrink(file) {
  if (!file.type.startsWith('image/') || file.size < 1.5 * 1024 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.85));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file;
  } catch { return file; }
}
const up = async (file, tag) => (await upload(`sell/${tag}-${safe(file.name)}`, file, { access: 'private', handleUploadUrl: '/api/blob/upload' })).url;

const COND = ['Like new', 'Good', 'Fair (visible wear)', 'Needs repair'];
export default function Sell() {
  const [f, setF] = useState({ name: '', phone: '', email: '', city: '', brand: '', model: '', cpu: '', ram: '', storage: '', condition: 'Good', purchase_date: '', expected_price: '', notes: '' });
  const [photos, setPhotos] = useState([]);
  const [bill, setBill] = useState(null);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const urls = [];
      for (const p of photos) urls.push(await up(await shrink(p), 'photo'));
      const billUrl = bill ? await up(bill, 'bill') : '';
      const r = await fetch('/api/sell', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, photos: urls, bill: billUrl }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Something went wrong');
      setDone(true); window.scrollTo({ top: 0 });
    } catch (x) { setErr(x.message); }
    setBusy(false);
  }
  if (done) return (
    <div className="wrap center" style={{ maxWidth: 620 }}>
      <div className="ok">Request received</div>
      <h1 style={{ fontSize: 44 }}>Thank you.</h1>
      <p style={{ color: 'var(--muted)', fontSize: 18 }}>We will review your laptop details and contact you on {f.phone} with an offer.</p>
    </div>
  );
  return (
    <div className="wrap" style={{ maxWidth: 820, padding: '56px 22px 90px' }}>
      <div className="eyebrow">Sell your laptop</div>
      <h1 style={{ fontSize: 'clamp(36px,6vw,64px)', marginBottom: 12 }}>Get a fair offer.</h1>
      <p style={{ color: 'var(--muted)', fontSize: 19, marginBottom: 36 }}>Tell us about your laptop and add a few photos. We will review it and contact you with an offer.</p>
      <form onSubmit={submit} className="sellform">
        {err ? <div className="err">{err}</div> : null}
        <div className="panel"><h3>About you</h3>
          <div className="row2">
            <label className="f">Full name<input required value={f.name} onChange={set('name')} /></label>
            <label className="f">Phone (10 digits)<input required inputMode="numeric" value={f.phone} onChange={set('phone')} /></label>
            <label className="f">Email (optional)<input type="email" value={f.email} onChange={set('email')} /></label>
            <label className="f">City<input value={f.city} onChange={set('city')} /></label>
          </div>
        </div>
        <div className="panel"><h3>Your laptop</h3>
          <div className="row2">
            <label className="f">Brand<input required placeholder="Dell, HP, Lenovo, Apple…" value={f.brand} onChange={set('brand')} /></label>
            <label className="f">Model<input required placeholder="Latitude 5420" value={f.model} onChange={set('model')} /></label>
            <label className="f">Processor<input placeholder="Core i5 11th Gen" value={f.cpu} onChange={set('cpu')} /></label>
            <label className="f">RAM<input placeholder="8 GB" value={f.ram} onChange={set('ram')} /></label>
            <label className="f">Storage<input placeholder="256 GB SSD" value={f.storage} onChange={set('storage')} /></label>
            <label className="f">Condition<select value={f.condition} onChange={set('condition')}>{COND.map((c) => <option key={c}>{c}</option>)}</select></label>
            <label className="f">Date of purchase<input type="date" max={new Date().toISOString().slice(0, 10)} value={f.purchase_date} onChange={set('purchase_date')} /></label>
            <label className="f">Expected price (₹)<input type="number" min="0" value={f.expected_price} onChange={set('expected_price')} /></label>
          </div>
          <label className="f">Anything else we should know<textarea rows={3} placeholder="Battery health, repairs, accessories included…" value={f.notes} onChange={set('notes')} /></label>
        </div>
        <div className="panel"><h3>Photos and bill</h3>
          <label className="f">Photos of the laptop (2 to 6, front, screen, keyboard, ports)
            <input type="file" accept="image/*" multiple onChange={(e) => setPhotos([...e.target.files].slice(0, 6))} /></label>
          {photos.length ? <div className="thumbs">{photos.map((p, i) => <img key={i} src={URL.createObjectURL(p)} alt="" />)}</div> : null}
          <label className="f">Purchase bill (optional, image or PDF)
            <input type="file" accept="image/*,application/pdf" onChange={(e) => setBill(e.target.files[0] || null)} /></label>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>A bill helps us verify ownership and can improve your offer. Your files are private and only seen by our team.</p>
        </div>
        <button className="btn" style={{ width: '100%', padding: 16, fontSize: 17 }} disabled={busy}>{busy ? 'Submitting…' : 'Submit for an offer'}</button>
      </form>
    </div>
  );
}
