import crypto from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE = 'ls_admin';
const MAX_AGE = 60 * 60 * 24 * 7;
const secret = () => process.env.SESSION_SECRET || 'dev-secret-change-me';
const sign = (v) => crypto.createHmac('sha256', secret()).update(v).digest('hex');

export function checkPassword(input) {
  const expected = process.env.ADMIN_PASSWORD || '';
  if (!expected) return false;
  const a = Buffer.from(String(input));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export async function setAdminCookie() {
  const ts = String(Date.now());
  (await cookies()).set(COOKIE, `${ts}.${sign(ts)}`, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: MAX_AGE,
  });
}
export async function clearAdminCookie() {
  (await cookies()).set(COOKIE, '', { path: '/', maxAge: 0 });
}
export async function isAdmin() {
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return false;
  const [ts, sig] = v.split('.');
  if (!ts || !sig) return false;
  const good = sign(ts);
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return false;
  return Date.now() - Number(ts) < MAX_AGE * 1000;
}
