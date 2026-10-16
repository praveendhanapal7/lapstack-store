// Product types. Laptops and RAM share the same fields; only the labels differ.
export const CATEGORIES = { laptop: 'Laptop', ram: 'RAM' };
export const LABELS = {
  laptop: { cpu: 'Processor', ram: 'Memory', storage: 'Storage', display: 'Display' },
  ram: { cpu: 'Speed & latency', ram: 'Capacity & type', storage: 'Form factor', display: 'Part number' },
};
export const catOf = (p) => (p?.category === 'ram' ? 'ram' : 'laptop');
