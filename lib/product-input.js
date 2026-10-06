const MAX_IMAGES = 5;
function cleanImages(b) {
  let a = b.images;
  if (typeof a === 'string') { try { a = JSON.parse(a); } catch { a = []; } }
  if (!Array.isArray(a)) a = [];
  a = a.map((u) => String(u || '').trim()).filter((u) => /^https:\/\//.test(u) || u.startsWith('/laptops/'));
  if (!a.length && b.image) a = [String(b.image).trim()].filter(Boolean);
  return [...new Set(a)].slice(0, MAX_IMAGES);
}

export function cleanProduct(b) {
  const price = parseInt(b.price, 10);
  const stock = parseInt(b.stock, 10);
  if (!String(b.name || '').trim()) return { error: 'Name is required' };
  if (!(price > 0)) return { error: 'Price must be a positive number' };
  const images = cleanImages(b);
  return {
    value: {
      name: String(b.name).trim(), cpu: String(b.cpu || '').trim(), ram: String(b.ram || '').trim(),
      storage: String(b.storage || '').trim(), display: String(b.display || '').trim(),
      price, stock: stock >= 0 ? stock : 0, images: JSON.stringify(images), image: images[0] || '', note: String(b.note || '').trim(),
      warranty: b.warranty ? 1 : 0, active: b.active === false || b.active === 0 ? 0 : 1,
    },
  };
}
