// Every laptop: 6 months from the purchase date.
//   months 0-3: "full"    = full warranty, no cost to the customer
//   months 3-6: "service" = service support: service charge is zero, customer pays only for any spare part
//   after 6 months: "expired"
const parse = (s) => {
  const m = String(s).match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])) : new Date(s);
};
const addMonths = (d, n) => {
  const r = new Date(d.getTime());
  const day = r.getUTCDate();
  r.setUTCDate(1);
  r.setUTCMonth(r.getUTCMonth() + n);
  const last = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate();
  r.setUTCDate(Math.min(day, last));
  return r;
};

/** purchasedAt: the order's created_at ("YYYY-MM-DD HH:MM:SS", UTC). */
export function warrantyStatus(purchasedAt, now = new Date()) {
  const p = parse(purchasedAt);
  const fullUntil = addMonths(p, 3);
  const serviceUntil = addMonths(p, 6);
  const phase = now < fullUntil ? 'full' : now < serviceUntil ? 'service' : 'expired';
  const end = phase === 'full' ? fullUntil : serviceUntil;
  return {
    phase,
    daysLeft: phase === 'expired' ? 0 : Math.max(1, Math.ceil((end - now) / 86400000)),
    fullUntil: fullUntil.toISOString(),
    serviceUntil: serviceUntil.toISOString(),
  };
}

export const CLAIM_STATUS = ['new', 'contacted', 'in_repair', 'resolved', 'rejected'];
