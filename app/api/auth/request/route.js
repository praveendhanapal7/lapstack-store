import crypto from 'node:crypto';
import { q, one } from '@/lib/db';
import { sendMail } from '@/lib/mail';
import { hashCode, normEmail, validEmail } from '@/lib/customer';
export const dynamic = 'force-dynamic';
const bad = (error, status = 400) => Response.json({ error }, { status });

// Step 1 of sign-in: email a 6-digit code (valid 10 minutes).
export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  const email = normEmail(b.email);
  if (!validEmail(email)) return bad('Please enter a valid email address.');

  const r = await one(
    `SELECT COUNT(*)::int AS c, COALESCE(EXTRACT(EPOCH FROM (now() - MAX(created_at))), 9999)::float AS since
     FROM login_codes WHERE email = $1 AND created_at > now() - interval '1 hour'`, [email]);
  if (r.since < 45) return bad('Please wait a minute before asking for another code.', 429);
  if (r.c >= 5) return bad('Too many codes requested. Please try again in an hour.', 429);

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const row = await one(`INSERT INTO login_codes (email, code_hash, expires_at) VALUES ($1, $2, now() + interval '10 minutes') RETURNING id`, [email, hashCode(email, code)]);
  const sent = await sendMail({
    to: email,
    subject: `${code} is your Lapstack sign-in code`,
    text: `Your Lapstack sign-in code is ${code}\n\nIt works for 10 minutes. If you did not ask for it, you can ignore this email.\n\nLapstack · lapstack.in`,
  });
  if (!sent) {
    await q('DELETE FROM login_codes WHERE id = $1', [row.id]);
    return bad('We could not send the email right now. Please try again, or WhatsApp us to order.', 502);
  }
  return Response.json({ ok: true });
}
