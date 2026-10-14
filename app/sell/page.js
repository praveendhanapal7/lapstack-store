'use client';
import { useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import { track } from '@/lib/pixel';

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

const BRANDS = ['Dell', 'HP', 'Lenovo', 'Apple', 'Asus', 'Acer', 'MSI', 'Microsoft', 'Samsung', 'Other'];
const RAM = ['4 GB', '8 GB', '12 GB', '16 GB', '24 GB', '32 GB', '64 GB'];
const SSD = ['No SSD', '128 GB', '256 GB', '512 GB', '1 TB', '2 TB'];
const HDD = ['No hard disk', '320 GB', '500 GB', '1 TB', '2 TB'];
const VRAM = ['2 GB', '3 GB', '4 GB', '6 GB', '8 GB', '12 GB', '16 GB'];
const COND = ['Like new', 'Good', 'Fair (visible wear)', 'Needs repair'];
// The photos we need, in order. The first five are required.
const SHOTS = [
  ['Closed laptop', 'Lid closed, top view'],
  ['Open, front face', 'Screen ON, straight from the front'],
  ['Open at 90°', 'Side view, screen upright'],
  ['Keyboard & touchpad', 'Close-up from above'],
  ['Bottom side', 'Flip it over, show the base'],
  ['Ports or charger', 'Optional'],
];
const REQUIRED = 5;

export default function Sell() {
  const [f, setF] = useState({ name: '', phone: '', email: '', city: '', brand: '', model: '', cpu: '', ram: '', ssd: '', hdd: 'No hard disk', gpu: 'integrated', gpu_name: '', gpu_memory: '', condition: 'Good', purchase_date: '', expected_price: '', notes: '' });
  const [photos, setPhotos] = useState(Array(SHOTS.length).fill(null));
  const [bill, setBill] = useState(null);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(''); const [done, setDone] = useState(false);
  const started = useRef(false);
  const pick = useRef(null); const slot = useRef(0);
  const set = (k) => (e) => {
    // Meta Pixel: first time someone starts filling the form.
    if (!started.current) { started.current = true; track('SellFormStarted', { content_category: 'Sell laptop' }, undefined, true); }
    setF({ ...f, [k]: e.target.value });
  };
  const have = photos.filter(Boolean).length;
  const requiredDone = photos.slice(0, REQUIRED).every(Boolean);

  function choose(i) { slot.current = i; pick.current?.click(); }
  function onFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    setPhotos((p) => p.map((x, k) => (k === slot.current ? file : x)));
  }

  async function submit(e) {
    e.preventDefault(); setErr('');
    if (!requiredDone) { setErr(`Please add all ${REQUIRED} required photos (closed, front, 90°, keyboard, bottom).`); return; }
    if (f.gpu === 'dedicated' && !f.gpu_memory) { setErr('Please choose the graphics memory.'); return; }
    if (f.ssd === 'No SSD' && f.hdd === 'No hard disk') { setErr('Please choose the SSD or hard disk size.'); return; }
    try {
      const urls = [];
      const list = photos.map((p, i) => [p, i]).filter(([p]) => p);
      for (let n = 0; n < list.length; n++) {
        setBusy(`Uploading photo ${n + 1} of ${list.length}…`);
        urls.push(await up(await shrink(list[n][0]), 'photo' + (list[n][1] + 1)));
      }
      setBusy('Sending…');
      const billUrl = bill ? await up(bill, 'bill') : '';
      const r = await fetch('/api/sell', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, photos: urls, bill: billUrl }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Something went wrong');
      // Meta Pixel: a completed sell request (the server sends the same event with this id).
      track('Lead', { content_category: 'Sell laptop', content_name: `${f.brand} ${f.model}`.trim() }, { eventID: d.eventId });
      setDone(true); window.scrollTo({ top: 0 });
    } catch (x) { setErr(x.message); }
    setBusy('');
  }

  if (done) return (
    <div className="wrap center" style={{ maxWidth: 620 }}>
      <div className="ok">Request received</div>
      <h1 style={{ fontSize: 44 }}>Thank you.</h1>
      <p style={{ color: 'var(--muted)', fontSize: 18 }}>We will check your laptop details and photos and call or WhatsApp you on {f.phone} with an offer.</p>
    </div>
  );
  return (
    <div className="wrap" style={{ maxWidth: 820, padding: '56px 22px 90px' }}>
      <div className="eyebrow">Sell your laptop</div>
      <h1 style={{ fontSize: 'clamp(36px,6vw,64px)', marginBottom: 12 }}>Get a fair offer.</h1>
      <p style={{ color: 'var(--muted)', fontSize: 19, marginBottom: 36 }}>Tell us about your laptop and add 5 photos. We will review it and contact you with an offer.</p>
      <form onSubmit={submit} className="sellform">
        <div className="panel"><h3>About you</h3>
          <div className="row2">
            <label className="f">Full name<input required autoComplete="name" value={f.name} onChange={set('name')} /></label>
            <label className="f">WhatsApp number (10 digits)<input required inputMode="numeric" autoComplete="tel" value={f.phone} onChange={set('phone')} /></label>
            <label className="f">City<input required value={f.city} onChange={set('city')} /></label>
            <label className="f">Email (optional)<input type="email" autoComplete="email" value={f.email} onChange={set('email')} /></label>
          </div>
        </div>

        <div className="panel"><h3>Your laptop</h3>
          <div className="row2">
            <label className="f">Brand
              <select required value={f.brand} onChange={set('brand')}><option value="">Choose…</option>{BRANDS.map((b) => <option key={b}>{b}</option>)}</select>
            </label>
            <label className="f">Model<input required placeholder="e.g. Latitude 5420, ThinkPad T14" value={f.model} onChange={set('model')} /></label>
            <label className="f">Processor<input required placeholder="e.g. Intel Core i5 11th Gen, Ryzen 5 5500U" value={f.cpu} onChange={set('cpu')} /></label>
            <label className="f">RAM
              <select required value={f.ram} onChange={set('ram')}><option value="">Choose…</option>{RAM.map((x) => <option key={x}>{x}</option>)}</select>
            </label>
            <label className="f">SSD
              <select required value={f.ssd} onChange={set('ssd')}><option value="">Choose…</option>{SSD.map((x) => <option key={x}>{x}</option>)}</select>
            </label>
            <label className="f">Hard disk (optional)
              <select value={f.hdd} onChange={set('hdd')}>{HDD.map((x) => <option key={x}>{x}</option>)}</select>
            </label>
          </div>

          <div className="f">Graphics
            <div className="seg" role="radiogroup">
              <button type="button" role="radio" aria-checked={f.gpu === 'integrated'} className={f.gpu === 'integrated' ? 'on' : ''} onClick={() => set('gpu')({ target: { value: 'integrated' } })}>No graphics card<small>Normal / integrated</small></button>
              <button type="button" role="radio" aria-checked={f.gpu === 'dedicated'} className={f.gpu === 'dedicated' ? 'on' : ''} onClick={() => set('gpu')({ target: { value: 'dedicated' } })}>Graphics card model<small>NVIDIA / AMD card</small></button>
            </div>
          </div>
          {f.gpu === 'dedicated' ? (
            <div className="row2">
              <label className="f">Graphics card<input placeholder="e.g. NVIDIA RTX 3050, GTX 1650" value={f.gpu_name} onChange={set('gpu_name')} /></label>
              <label className="f">Graphics memory
                <select required value={f.gpu_memory} onChange={set('gpu_memory')}><option value="">Choose…</option>{VRAM.map((x) => <option key={x}>{x}</option>)}</select>
              </label>
            </div>
          ) : null}

          <div className="row2">
            <label className="f">Condition<select value={f.condition} onChange={set('condition')}>{COND.map((c) => <option key={c}>{c}</option>)}</select></label>
            <label className="f">Expected price (₹, optional)<input type="number" min="0" value={f.expected_price} onChange={set('expected_price')} /></label>
          </div>
          <label className="f">Describe your laptop exactly
            <textarea rows={4} required minLength={15} value={f.notes} onChange={set('notes')}
              placeholder={'Battery backup (hours), any scratches or dents, keys or screen problems, repairs done, charger and box included, warranty left…'} />
          </label>
        </div>

        <div className="panel"><h3>Photos <small className="muted" style={{ fontSize: 14, fontWeight: 500 }}>{have}/{SHOTS.length} · first {REQUIRED} required</small></h3>
          <p className="muted small" style={{ marginTop: -8 }}>Take photos in daylight on a plain table. Tap a box to add or change that photo.</p>
          <div className="shots">
            {SHOTS.map(([t, hint], i) => (
              <button type="button" key={t} className={'shot' + (photos[i] ? ' has' : '') + (i >= REQUIRED ? ' opt' : '')} onClick={() => choose(i)}>
                {photos[i] ? <img src={URL.createObjectURL(photos[i])} alt={t} /> : <span className="shotplus">+</span>}
                <b>{i + 1}. {t}</b><small>{photos[i] ? 'Tap to change' : hint}</small>
              </button>
            ))}
          </div>
          <input ref={pick} type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files[0]); e.target.value = ''; }} />
          <label className="f" style={{ marginTop: 14 }}>Purchase bill (optional, image or PDF)
            <input type="file" accept="image/*,application/pdf" onChange={(e) => setBill(e.target.files[0] || null)} /></label>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>A bill helps us verify ownership and can improve your offer. Your photos are private and only seen by our team.</p>
        </div>

        {err ? <div className="err">{err}</div> : null}
        <button className="btn" style={{ width: '100%', padding: 16, fontSize: 17 }} disabled={!!busy}>{busy || 'Submit for an offer'}</button>
      </form>
    </div>
  );
}
