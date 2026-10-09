import crypto from 'node:crypto';
import { q, one } from '@/lib/db';
import { hashCode, normEmail, setUserCookie } from '@/lib/customer';
export const dynamic = 'force-dynamic';
const bad = (error, status = 400) => Response.json({ error }, { status });

// Step 2: check the code, create the account on first sign-in, set the session cookie.
export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  const email = normEmail(b.email);
  const code = String(b.code || '').replace(/\D/g, '');
  if (!email || code.length !== 6) return bad('Enter the 6-digit code from your email.');

  const row = await one(`SELECT * FROM login_codes WHERE email = $1 AND used = 0 AND expires_at > now() ORDER BY id DESC LIMIT 1`, [email]);
  if (!row) return bad('That code has expired. Please ask for a new one.');
  if (row.attempts >= 5) return bad('Too many wrong tries. Please ask for a new code.', 429);

  const a = Buffer.from(hashCode(email, code));
  const g = Buffer.from(row.code_hash);
  if (a.length !== g.length || !crypto.timingSafeEqual(a, g)) {
    await q('UPDATE login_codes SET attempts = attempts + 1 WHERE id = $1', [row.id]);
    return bad('That code is not right. Please check and try again.');
  }
  await q('UPDATE login_codes SET used = 1 WHERE email = $1', [email]);
  const u = await one(
    `INSERT INTO users (email) VALUES ($1) ON CONFLICT (email) DO UPDATE SET last_login = now() RETURNING id, (xmax = 0) AS is_new`, [email]);
  // Orders placed as a guest with this (now verified) email show up in the account.
  await q('UPDATE orders SET user_id = $1 WHERE user_id IS NULL AND lower(email) = $2', [u.id, email]);
  await setUserCookie(u.id);
  return Response.json({ ok: true, isNew: u.is_new });
}
