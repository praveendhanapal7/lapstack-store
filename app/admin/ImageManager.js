'use client';
import { useEffect, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import ImageCropper from './ImageCropper';

const MAX = 5;

// Shrink big phone photos before upload (keeps them under the 8 MB limit and loads faster for customers).
async function shrink(file) {
  if (!file.type.startsWith('image/') || file.size < 1.5 * 1024 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.88));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file;
  } catch { return file; }
}
async function putFile(file) {
  const f = await shrink(file);
  const r = await upload('products/' + f.name.replace(/[^\w.-]+/g, '_'), f, { access: 'public', handleUploadUrl: '/api/blob/upload' });
  return r.url;
}

/** Up to 5 photos: add several at once, tap a photo (or Replace) to swap it, choose which one is the main photo. */
export default function ImageManager({ images, onChange, onBusy }) {
  const [busy, setBusy] = useState(0);        // photos being uploaded right now
  const [replacing, setReplacing] = useState(-1);
  const [err, setErr] = useState('');
  const addRef = useRef(null);
  const swapRef = useRef(null);
  const swapIdx = useRef(-1);
  const [editing, setEditing] = useState(-1); // photo open in the crop editor
  useEffect(() => { onBusy?.(busy > 0 || replacing >= 0); }, [busy, replacing]); // eslint-disable-line

  async function add(files) {
    const list = [...files].filter((f) => f.type.startsWith('image/')).slice(0, MAX - images.length);
    if (!list.length) return;
    setErr(''); setBusy(list.length);
    let next = [...images];
    for (const f of list) {
      try { next = [...next, await putFile(f)]; onChange(next); }
      catch (e) { setErr(e.message || 'One photo could not be uploaded. Please try again.'); }
      setBusy((b) => b - 1);
    }
  }
  async function swap(file) {
    const i = swapIdx.current;
    if (!file || i < 0) return;
    setErr(''); setReplacing(i);
    try { const url = await putFile(file); onChange(images.map((u, k) => (k === i ? url : u))); }
    catch (e) { setErr(e.message || 'The photo could not be uploaded. Please try again.'); }
    setReplacing(-1);
  }
  async function saveEdit(file) {
    const i = editing;
    setEditing(-1); setErr(''); setReplacing(i);
    try { const url = await putFile(file); onChange(images.map((u, k) => (k === i ? url : u))); }
    catch (e) { setErr(e.message || 'The edited photo could not be saved. Please try again.'); }
    setReplacing(-1);
  }
  const moveTo = (i, j) => { const a = [...images]; [a[i], a[j]] = [a[j], a[i]]; onChange(a); };
  const pickSwap = (i) => { swapIdx.current = i; swapRef.current?.click(); };
  const locked = busy > 0 || replacing >= 0;

  return (
    <div className="imgmgr">
      <div className="imgmgr-head"><b>Photos</b><span>{images.length} of {MAX} · the first one is the main photo · use ← → to change the order</span></div>
      {err ? <div className="err">{err}</div> : null}
      <div className="imgs">
        {images.map((u, i) => (
          <div className={'imgtile' + (i === 0 ? ' main' : '')} key={u}>
            <button type="button" className="imgpic" disabled={locked} onClick={() => pickSwap(i)} title="Tap to replace this photo">
              <img src={u} alt="" />
              {i === 0 ? <span className="mainbadge">Main</span> : null}
              {replacing === i ? <span className="imgbusy">Uploading…</span> : <span className="imghint">Replace</span>}
            </button>
            <div className="imgacts">
              <button type="button" disabled={locked || i === 0} onClick={() => moveTo(i, i - 1)} title="Move left">←</button>
              <button type="button" disabled={locked} onClick={() => setEditing(i)}>Crop</button>
              <button type="button" disabled={locked || i === images.length - 1} onClick={() => moveTo(i, i + 1)} title="Move right">→</button>
            </div>
            <div className="imgacts">
              {i > 0 ? <button type="button" disabled={locked} onClick={() => onChange([images[i], ...images.filter((_, k) => k !== i)])}>Make main</button> : <span />}
              <button type="button" className="rm" disabled={locked} onClick={() => onChange(images.filter((_, k) => k !== i))}>Remove</button>
            </div>
          </div>
        ))}
        {Array.from({ length: busy }).map((_, k) => <div className="imgtile" key={'b' + k}><div className="imgpic ghost"><span className="imgbusy">Uploading…</span></div></div>)}
        {images.length + busy < MAX ? (
          <button type="button" className="imgadd" disabled={locked} onClick={() => addRef.current?.click()}>
            <b>+</b><span>Add photos</span><small>You can pick several at once</small>
          </button>
        ) : null}
      </div>
      {editing >= 0 ? <ImageCropper src={images[editing]} onCancel={() => setEditing(-1)} onDone={saveEdit} /> : null}
      <input ref={addRef} type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
      <input ref={swapRef} type="file" accept="image/*" hidden onChange={(e) => { swap(e.target.files[0]); e.target.value = ''; }} />
    </div>
  );
}
