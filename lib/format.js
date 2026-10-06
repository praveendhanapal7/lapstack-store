export const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');

/** Up to 5 photos for a laptop: the gallery if it has one, otherwise the single main photo. */
export function productImages(p) {
  let a = [];
  try { a = JSON.parse(p?.images || '[]'); } catch {}
  if (!Array.isArray(a)) a = [];
  a = a.filter((u) => typeof u === 'string' && u);
  if (!a.length && p?.image) a = [p.image];
  return a.slice(0, 5);
}
