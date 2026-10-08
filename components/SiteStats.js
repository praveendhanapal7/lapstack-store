'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const get = (st, k) => { try { return st.getItem(k); } catch { return null; } };
const set = (st, k, v) => { try { st.setItem(k, v); } catch {} };
const rid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function ids() {
  let vid = get(localStorage, 'ls_vid'); if (!vid) { vid = rid(); set(localStorage, 'ls_vid', vid); }
  // A session ends after 30 minutes without activity.
  let sid = get(localStorage, 'ls_sid'); const last = Number(get(localStorage, 'ls_last') || 0);
  let source = get(localStorage, 'ls_src');
  if (!sid || Date.now() - last > 30 * 60000) {
    sid = rid(); set(localStorage, 'ls_sid', sid);
    const u = new URL(location.href); const ref = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : '';
    const utm = u.searchParams.get('utm_source');
    source = u.searchParams.has('fbclid') || /facebook|instagram|^l\.|fb\./.test(utm || ref) ? (/instagram/.test(utm + ref) ? 'Instagram' : 'Facebook / Instagram ads')
      : utm ? utm : /google/.test(ref) ? 'Google' : /whatsapp/.test(ref) ? 'WhatsApp' : ref && !ref.endsWith('lapstack.in') ? ref : 'Direct';
    set(localStorage, 'ls_src', source);
  }
  set(localStorage, 'ls_last', String(Date.now()));
  return { vid, sid, source: source || 'Direct' };
}

// Sends one event to our own counter. Never throws.
export function logEvent(name, extra = {}) {
  if (typeof window === 'undefined') return;
  try {
    const body = JSON.stringify({ name, path: location.pathname, ...ids(), ...extra });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
    else fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
  } catch {}
}

export default function SiteStats() {
  const path = usePathname();
  useEffect(() => { logEvent('page_view'); }, [path]);
  return null;
}
