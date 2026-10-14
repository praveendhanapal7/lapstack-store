import { one } from '@/lib/db';
import { alertShop } from '@/lib/notify';
import { sendCapi, visitor } from '@/lib/capi';
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
  if (!t('cpu') || !t('ram')) return bad('Please enter the processor and RAM.');
  if (t('notes').length < 15) return bad('Please describe your laptop in a few words.');
  // SSD + optional hard disk are kept together in "storage"; graphics in "gpu".
  const ssd = t('ssd'), hdd = t('hdd') === 'No hard disk' ? '' : t('hdd');
  const storage = [ssd && ssd !== 'No SSD' ? ssd + ' SSD' : '', hdd ? hdd + ' HDD' : ''].filter(Boolean).join(' + ') || t('storage');
  if (!storage) return bad('Please choose the SSD or hard disk size.');
  const gpu = b.gpu === 'dedicated' ? ['Graphics card', t('gpu_name'), t('gpu_memory')].filter(Boolean).join(' · ') : 'No graphics card';
  if (b.gpu === 'dedicated' && !t('gpu_memory')) return bad('Please choose the graphics memory.');
  const photos = Array.isArray(b.photos) ? b.photos.filter(okUrl) : [];
  if (photos.length < 5) return bad('Please add at least 5 photos of the laptop.');
  if (photos.length > 6) return bad('You can add up to 6 photos.');
  const bill = b.bill && okUrl(b.bill) ? b.bill : '';
  const price = parseInt(b.expected_price, 10) || 0;
  const row = await one(`INSERT INTO sell_requests (name,phone,email,city,brand,model,cpu,ram,storage,condition,purchase_date,expected_price,notes,photos,bill,hdd,gpu)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id`,
    [name, phone, email, city, brand, model, t('cpu'), t('ram'), storage, t('condition'), t('purchase_date'), price, t('notes'), JSON.stringify(photos), bill, hdd, gpu]);
  await alertShop(`New sell request: ${brand} ${model}`, [
    `${brand} ${model}`, [t('cpu'), t('ram'), storage, gpu].filter(Boolean).join(' · '),
    t('condition') && `Condition: ${t('condition')}`, price && `Expected price: ₹${price.toLocaleString('en-IN')}`,
    `${photos.length} photo(s)${bill ? ' + bill' : ''}: open the admin panel to view`,
    '', `${name}, ${phone}${email ? ', ' + email : ''}${city ? ', ' + city : ''}`,
  ]);
  // Meta: a completed sell request, also sent from the server (same id as the browser Pixel event).
  const eventId = 'sell-' + row.id;
  await sendCapi({ name: 'Lead', id: eventId, url: 'https://lapstack.in/sell', who: visitor(req), email, phone, city,
    custom: { content_category: 'Sell laptop', content_name: `${brand} ${model}` } });
  return Response.json({ ok: true, eventId });
}
