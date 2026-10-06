import { get } from '@vercel/blob';
import { isAdmin } from '@/lib/auth';
export const dynamic = 'force-dynamic';

// Seller photos and bills: only the admin can open them through the site.
export async function GET(req) {
  if (!(await isAdmin())) return new Response('Unauthorized', { status: 401 });
  const u = new URL(req.url).searchParams.get('u') || '';
  let parsed;
  try { parsed = new URL(u); } catch { return new Response('Bad request', { status: 400 }); }
  if (!parsed.hostname.endsWith('blob.vercel-storage.com') || !parsed.pathname.startsWith('/sell/')) return new Response('Not allowed', { status: 403 });
  const headers = { 'Cache-Control': 'private, max-age=300' };
  // Older requests were uploaded to the public store before seller files went private.
  if (parsed.hostname.includes('.public.')) {
    const r = await fetch(u);
    if (!r.ok) return new Response('Not found', { status: 404 });
    return new Response(r.body, { headers: { ...headers, 'Content-Type': r.headers.get('content-type') || 'application/octet-stream' } });
  }
  const r = await get(u, { access: 'private', token: process.env.SELL_BLOB_READ_WRITE_TOKEN }).catch(() => null);
  if (!r || r.statusCode !== 200) return new Response('Not found', { status: 404 });
  return new Response(r.stream, { headers: { ...headers, 'Content-Type': r.blob.contentType || 'application/octet-stream' } });
}
