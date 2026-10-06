export function cleanProduct(b) {
  const price = parseInt(b.price, 10);
  const stock = parseInt(b.stock, 10);
  if (!String(b.name || '').trim()) return { error: 'Name is required' };
  if (!(price > 0)) return { error: 'Price must be a positive number' };
  return {
    value: {
      name: String(b.name).trim(), cpu: String(b.cpu || '').trim(), ram: String(b.ram || '').trim(),
      storage: String(b.storage || '').trim(), display: String(b.display || '').trim(),
      price, stock: stock >= 0 ? stock : 0, image: String(b.image || '').trim(), note: String(b.note || '').trim(),
      warranty: b.warranty ? 1 : 0, active: b.active === false || b.active === 0 ? 0 : 1,
    },
  };
}
