// Sends an event to the Meta Pixel (installed in app/layout.js). Safe to call anywhere on the client:
// does nothing if the Pixel is off or blocked, and waits a few seconds for it to finish loading.
import { logEvent } from '@/components/SiteStats';

const SERVER_RELAY = ['ViewContent', 'Contact']; // Lead is sent by /api/enquiries itself
const OWN = { ViewContent: 'view_product', AddToCart: 'add_to_cart', InitiateCheckout: 'checkout', Purchase: 'purchase', Lead: 'enquiry' };

export function track(event, params = {}, options) {
  if (typeof window === 'undefined') return;
  // Also feeds the admin Analytics page (our own counter).
  if (OWN[event]) logEvent(OWN[event], { product_id: params.content_ids?.length === 1 ? params.content_ids[0] : undefined, product_name: params.content_name || '', value: params.value });
  // Every event gets an id. The server sends the same event with the same id (Conversions API),
  // so Meta counts it once and still gets it when the browser blocks the Pixel.
  const eventID = options?.eventID || event.toLowerCase() + '-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  if (!options?.eventID && SERVER_RELAY.includes(event)) {
    try {
      const body = JSON.stringify({ name: event, id: eventID, url: location.href, custom: params });
      if (navigator.sendBeacon) navigator.sendBeacon('/api/capi', new Blob([body], { type: 'application/json' }));
      else fetch('/api/capi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
    } catch {}
  }
  let tries = 0;
  const send = () => {
    if (typeof window.fbq === 'function') {
      try { window.fbq('track', event, params, { ...options, eventID }); } catch {}
      return;
    }
    if (++tries < 40) setTimeout(send, 250); // up to ~10 s
  };
  send();
}

export const product = (p) => ({ content_ids: [String(p.id)], content_name: p.name, content_type: 'product', value: Number(p.price) || 0, currency: 'INR' });
