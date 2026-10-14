import crypto from 'node:crypto';

// Meta Conversions API: sends events from our server too, so they still count when the visitor's
// browser blocks the Pixel. Needs META_CAPI_TOKEN (Events Manager → Lapstack Pixel → Settings →
// Conversions API → Generate access token). No token = nothing sent.
const PIXEL = (process.env.NEXT_PUBLIC_META_PIXEL_ID || '3214943238710618').replace(/\D/g, '');
const sha = (v) => (v ? crypto.createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex') : undefined);

/** Who the visitor is, from the request: IP, browser and Meta's _fbp/_fbc cookies. */
export function visitor(req) {
  const cookie = req.headers.get('cookie') || '';
  const get = (k) => cookie.match(new RegExp('(?:^|; )' + k + '=([^;]+)'))?.[1];
  return {
    ip: (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || undefined,
    ua: req.headers.get('user-agent') || undefined,
    fbp: get('_fbp'), fbc: get('_fbc'),
  };
}

export async function sendCapi({ name, id, url, who = {}, email, phone, city, custom = {} }) {
  const token = process.env.META_CAPI_TOKEN;
  if (!token || !PIXEL) return;
  const ph = phone ? String(phone).replace(/\D/g, '').slice(-10) : '';
  const user_data = {
    client_ip_address: who.ip, client_user_agent: who.ua, fbp: who.fbp, fbc: who.fbc,
    em: email ? [sha(email)] : undefined,
    ph: ph ? [sha('91' + ph)] : undefined,
    ct: city ? [sha(String(city).replace(/[^a-z]/gi, ''))] : undefined,
    country: [sha('in')],
  };
  const body = {
    data: [{ event_name: name, event_time: Math.floor(Date.now() / 1000), event_id: id, action_source: 'website', event_source_url: url, user_data, custom_data: custom }],
  };
  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${PIXEL}/events?access_token=${encodeURIComponent(token)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) console.error('Meta CAPI error', r.status, (await r.text().catch(() => '')).slice(0, 300));
  } catch (e) { console.error('Meta CAPI failed', e.message); }
}
