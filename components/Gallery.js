'use client';
import { useRef, useState } from 'react';

/** Product photos: swipe or use the arrows; tap a small photo to jump to it. */
export default function Gallery({ images, alt }) {
  const [i, setI] = useState(0);
  const x0 = useRef(0);
  const n = images.length;
  if (!n) return <div className="gal"><div className="ph" /></div>;
  const go = (d) => setI((v) => (v + d + n) % n);
  return (
    <div className="gal">
      <div className="ph" onTouchStart={(e) => { x0.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => { const d = e.changedTouches[0].clientX - x0.current; if (Math.abs(d) > 40) go(d < 0 ? 1 : -1); }}>
        <img src={images[i]} alt={alt} />
        {n > 1 ? (
          <>
            <button type="button" className="gnav prev" onClick={() => go(-1)} aria-label="Previous photo">‹</button>
            <button type="button" className="gnav next" onClick={() => go(1)} aria-label="Next photo">›</button>
            <span className="gcount">{i + 1} / {n}</span>
          </>
        ) : null}
      </div>
      {n > 1 ? (
        <div className="gthumbs">
          {images.map((u, k) => <button type="button" key={u} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`Photo ${k + 1}`}><img src={u} alt="" /></button>)}
        </div>
      ) : null}
    </div>
  );
}
