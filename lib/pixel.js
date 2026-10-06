// Sends an event to the Meta Pixel (installed in app/layout.js). Safe to call anywhere on the client:
// does nothing if the Pixel is off or blocked, and waits a few seconds for it to finish loading.
export function track(event, params = {}, options) {
  if (typeof window === 'undefined') return;
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
