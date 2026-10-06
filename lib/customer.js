import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { one } from './db';

const COOKIE = 'ls_user';
const MAX_AGE = 60 * 60 * 24 * 30;
const secret = () => process.env.SESSION_SECRET || 'dev-secret-change-me';
const sign = (v) => crypto.createHmac('sha256', secret()).update('user:' + v).digest('hex');

export const hashCode = (email, code) => crypto.createHmac('sha256', secret()).update(`code:${email}:${code}`).digest('hex');
export const normEmail = (e) => String(e || '').trim().toLowerCase();
export const validEmail = (e) => e.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export async function setUserCookie(userId) {
  const v = `${userId}.${Date.now()}`;
  (await cookies()).set(COOKIE, `${v}.${sign(v)}`, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: MAX_AGE });
}
export async function clearUserCookie() {
  (await cookies()).set(COOKIE, '', { path: '/', maxAge: 0 });
}
/** The signed-in customer, or null. */
export async function getUser() {
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return null;
  const [id, ts, sig] = v.split('.');
  if (!id || !ts || !sig) return null;
  const good = sign(`${id}.${ts}`);
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  if (Date.now() - Number(ts) > MAX_AGE * 1000) return null;
  return (await one('SELECT id, email, name, phone FROM users WHERE id = $1', [Number(id)])) || null;
}
