'use client';
import { useEffect, useRef, useState } from 'react';

const RATIOS = [['Free', 0], ['Square', 1], ['4:3', 4 / 3], ['16:9', 16 / 9]];
const MIN = 40; // smallest crop box, in screen pixels

/** Crop and rotate one photo. Drag the box to move it, drag a corner to resize. Calls onDone(File). */
export default function ImageCropper({ src, onDone, onCancel }) {
  const [img, setImg] = useState(null);     // loaded (and rotated) image as a canvas
  const [preview, setPreview] = useState('');
  const [rot, setRot] = useState(0);
  const [ratio, setRatio] = useState(0);
  const [box, setBox] = useState(null);     // crop box in screen pixels {x,y,w,h}
  const [err, setErr] = useState('');
  const [view, setView] = useState({ w: 0, h: 0 });
  const drag = useRef(null);
  const wrap = useRef(null);

  // Load the photo (CORS-safe so it can be cropped) and draw it rotated.
  useEffect(() => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => {
      const turn = rot % 180 !== 0;
      const c = document.createElement('canvas');
      c.width = turn ? el.naturalHeight : el.naturalWidth;
      c.height = turn ? el.naturalWidth : el.naturalHeight;
      const g = c.getContext('2d');
      g.translate(c.width / 2, c.height / 2);
      g.rotate((rot * Math.PI) / 180);
      g.drawImage(el, -el.naturalWidth / 2, -el.naturalHeight / 2);
      setImg(c); setPreview(c.toDataURL('image/jpeg', 0.8));
    };
    el.onerror = () => setErr('This photo could not be opened for editing.');
    el.src = src + (src.includes('?') ? '&' : '?') + 'edit=1';
  }, [src, rot]);

  // Fit the photo on screen and start with the whole photo selected.
  useEffect(() => {
    if (!img) return;
    const maxW = Math.min(620, (wrap.current?.clientWidth || 640) - 20); // minus the area's padding
    const k = Math.min(maxW / img.width, 440 / img.height, 1);
    const w = Math.round(img.width * k), h = Math.round(img.height * k);
    setView({ w, h });
    setBox(fit({ x: 0, y: 0, w, h }, ratio, w, h));
  }, [img]); // eslint-disable-line

  function fit(b, r, W, H) {
    if (!r) return b;
    let w = b.w, h = w / r;
    if (h > b.h) { h = b.h; w = h * r; }
    return { x: b.x + (b.w - w) / 2, y: b.y + (b.h - h) / 2, w, h };
  }
  function pickRatio(r) {
    setRatio(r);
    setBox(fit({ x: 0, y: 0, w: view.w, h: view.h }, r, view.w, view.h));
  }

  function start(e, mode) {
    e.preventDefault(); e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { mode, sx: e.clientX, sy: e.clientY, b: { ...box } };
  }
  function move(e) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    const W = view.w, H = view.h, b = d.b;
    let n;
    if (d.mode === 'move') {
      n = { ...b, x: Math.min(Math.max(0, b.x + dx), W - b.w), y: Math.min(Math.max(0, b.y + dy), H - b.h) };
    } else {
      // Resize from a corner; the opposite corner stays put.
      const left = d.mode.includes('l'), top = d.mode.includes('t');
      const ax = left ? b.x + b.w : b.x, ay = top ? b.y + b.h : b.y;
      let w = Math.max(MIN, left ? b.w - dx : b.w + dx);
      let h = Math.max(MIN, top ? b.h - dy : b.h + dy);
      if (ratio) h = w / ratio;
      w = Math.min(w, left ? ax : W - ax); h = Math.min(h, top ? ay : H - ay);
      if (ratio) { if (w / h > ratio) w = h * ratio; else h = w / ratio; }
      n = { x: left ? ax - w : ax, y: top ? ay - h : ay, w, h };
    }
    setBox(n);
  }
  const end = () => { drag.current = null; };

  async function apply() {
    const k = img.width / view.w;
    const sx = Math.round(box.x * k), sy = Math.round(box.y * k), sw = Math.round(box.w * k), sh = Math.round(box.h * k);
    const s = Math.min(1, 2000 / Math.max(sw, sh));
    const c = document.createElement('canvas');
    c.width = Math.round(sw * s); c.height = Math.round(sh * s);
    c.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
    try {
      const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.85));
      if (!blob) throw new Error();
      onDone(new File([blob], 'edited-' + Date.now() + '.jpg', { type: 'image/jpeg' }));
    } catch { setErr('This photo could not be saved. Try uploading it again instead.'); }
  }

  return (
    <div className="modal crop-modal" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="panel">
        <h3 style={{ marginBottom: 10 }}>Edit photo</h3>
        {err ? <div className="err">{err}</div> : null}
        <div className="crop-tools">
          {RATIOS.map(([l, r]) => <button type="button" key={l} className={ratio === r ? 'on' : ''} onClick={() => pickRatio(r)}>{l}</button>)}
          <button type="button" onClick={() => setRot((r) => (r + 90) % 360)}>↻ Rotate</button>
        </div>
        <div className="crop-area" ref={wrap} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
          {img && box ? (
            <div className="crop-stage" style={{ width: view.w, height: view.h }}>
              <img src={preview} alt="" draggable={false} />
              <div className="crop-box" style={{ left: box.x, top: box.y, width: box.w, height: box.h }} onPointerDown={(e) => start(e, 'move')}>
                {['tl', 'tr', 'bl', 'br'].map((c) => <i key={c} className={'h ' + c} onPointerDown={(e) => start(e, c)} />)}
              </div>
            </div>
          ) : !err ? <p className="muted">Loading photo…</p> : null}
        </div>
        <p className="muted small">Drag the box to move it. Drag a corner to resize.</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn" disabled={!img} onClick={apply}>Save photo</button>
          <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
