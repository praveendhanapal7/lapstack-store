import { q } from '@/lib/db';
import { alertShop } from '@/lib/notify';
export const dynamic = 'force-dynamic';
const bad = (error, status = 400) => Response.json({ error }, { status });

const okUrl = (u) => {
  try { const p = new URL(u); return p.hostname.endsWith('blob.vercel-storage.com') && p.pathname.startsWith('/sell/'); } catch { return false; }
};

export async function POST(req) {
  const b = await req.json().catch(() => null);
  if (!b) return bad('Invalid form');
  const t = (k) => String(b[k] || '').trim().slice(0, 500);
  const name = t('name'), city = t('city'), brand = t('brand'), model = t('model');
  const phone = t('phone').replace(/\D/g, '').slice(-10);
  const email = t('email');
  if (name.length < 2) return bad('Please enter your name.');
  if (phone.length !== 10) return bad('Please enter a 10 digit phone number.');
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return bad('Please enter a valid email or leave it empty.');
  if (!brand || !model) return bad('Please enter the laptop brand and model.');
  const photos = Array.isArray(b.photos) ? b.photos.filter(okUrl) : [];
  if (photos.length < 2) return bad('Please add at least 2 photos of the laptop.');
  if (photos.length > 6) return bad('You can add up to 6 photos.');
  const bill = b.bill && okUrl(b.bill) ? b.bill : '';
  const price = parseInt(b.expected_price, 10) || 0;
  await q(`INSERT INTO sell_requests (name,phone,email,city,brand,model,cpu,ram,storage,condition,purchase_date,expected_price,notes,photos,bill)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [name, phone, email, city, brand, model, t('cpu'), t('ram'), t('storage'), t('condition'), t('purchase_date'), price, t('notes'), JSON.stringify(photos), bill]);
  await alertShop(`New sell request: ${brand} ${model}`, [
    `${brand} ${model}`, [t('cpu'), t('ram'), t('storage')].filter(Boolean).join(' · '),
    t('condition') && `Condition: ${t('condition')}`, price && `Expected price: ₹${price.toLocaleString('en-IN')}`,
    `${photos.length} photo(s)${bill ? ' + bill' : ''}: open the admin panel to view`,
    '', `${name}, ${phone}${email ? ', ' + email : ''}${city ? ', ' + city : ''}`,
  ]);
  return Response.json({ ok: true });
}
