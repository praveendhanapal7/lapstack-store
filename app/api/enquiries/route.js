import { one, getProduct } from '@/lib/db';
import { sendMail } from '@/lib/mail';
import { alertShop } from '@/lib/notify';
import { BUSINESS as B } from '@/lib/business';
import { KINDS, SLOTS } from '@/lib/enquiry';
import { inr } from '@/lib/format';
export const dynamic = 'force-dynamic';
const bad = (error) => Response.json({ error }, { status: 400 });
const clip = (v, n) => String(v ?? '').trim().slice(0, n);

// A customer books a shop visit or a video call for a laptop.
export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  const kind = b.kind === 'video' ? 'video' : b.kind === 'visit' ? 'visit' : '';
  const name = clip(b.name, 80), email = clip(b.email, 120).toLowerCase(), city = clip(b.city, 60);
  const phone = String(b.phone || '').replace(/\D/g, '').slice(-10);
  const date = clip(b.date, 10), time = SLOTS.includes(b.time) ? b.time : '', note = clip(b.note, 500);
  if (!kind) return bad('Please choose visit or video call.');
  if (name.length < 2) return bad('Please enter your name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('Please enter a valid email.');
  if (city.length < 2) return bad('Please enter your city.');
  if (phone.length !== 10) return bad('Please enter a 10 digit WhatsApp number.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return bad('Please pick a date.');
  if (!time) return bad('Please pick a time.');
  const p = await getProduct(Number(b.productId));
  const product = p && p.active ? p : null;

  const row = await one(`INSERT INTO enquiries (kind, product_id, product_name, price, name, email, city, phone, pref_date, pref_time, note)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
    [kind, product?.id || null, product?.name || '', product?.price || 0, name, email, city, phone, date, time, note]);

  const when = `${new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}, ${time}`;
  const laptop = product ? `${product.name} (${inr(product.price)})` : 'Not chosen';
  await alertShop(`New ${kind === 'visit' ? 'shop visit' : 'video call'} booking: ${name}, ${city}`, [
    KINDS[kind], `Laptop: ${laptop}`, `Name: ${name}`, `WhatsApp: +91 ${phone}`, `Email: ${email}`, `City: ${city}`, `When: ${when}`, note ? `Note: ${note}` : '',
    `Reply on WhatsApp: https://wa.me/91${phone}`,
  ]);
  await sendMail({
    to: email,
    subject: kind === 'visit' ? 'Your Lapstack shop visit is booked' : 'Your Lapstack video call is booked',
    text: kind === 'visit'
      ? `Hi ${name},\n\nThanks! We have noted your visit.\n\nLaptop: ${laptop}\nWhen: ${when}\n\nWe will WhatsApp you on +91 ${phone} to confirm.\n\nShop address:\n${B.address}\nMap: https://maps.google.com/?q=${encodeURIComponent(B.address)}\nPhone: ${B.phone}\n\nLapstack · lapstack.in`
      : `Hi ${name},\n\nThanks! Your video call is booked.\n\nLaptop: ${laptop}\nWhen: ${when}\n\nWe will video call you on WhatsApp at +91 ${phone} and show you the laptop live.\n\nQuestions? ${B.phone}\n\nLapstack · lapstack.in`,
  });
  return Response.json({ ok: true, id: row.id });
}
