// Sends an event to the Meta Pixel (installed in app/layout.js). Safe to call anywhere on the client:
// does nothing if the Pixel is off or blocked, and waits a few seconds for it to finish loading.
import { logEvent } from '@/components/SiteStats';

const OWN = { ViewContent: 'view_product', AddToCart: 'add_to_cart', InitiateCheckout: 'checkout', Purchase: 'purchase' };

export function track(event, params = {}, options) {
  if (typeof window === 'undefined') return;
  // Also feeds the admin Analytics page (our own counter).
  if (OWN[event]) logEvent(OWN[event], { product_id: params.content_ids?.length === 1 ? params.content_ids[0] : undefined, product_name: params.content_name || '', value: params.value });
  let tries = 0;
  const send = () => {
    if (typeof window.fbq === 'function') {
      try { options ? window.fbq('track', event, params, options) : window.fbq('track', event, params); } catch {}
      return;
    }
    if (++tries < 40) setTimeout(send, 250); // up to ~10 s
  };
  send();
}

export const product = (p) => ({ content_ids: [String(p.id)], content_name: p.name, content_type: 'product', value: Number(p.price) || 0, currency: 'INR' });
