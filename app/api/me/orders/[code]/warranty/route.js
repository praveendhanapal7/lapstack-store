import { getUser } from '@/lib/customer';
import { createWarrantyClaim } from '@/lib/orders';
export const dynamic = 'force-dynamic';
export async function POST(req, { params }) {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const r = await createWarrantyClaim(user, String((await params).code), b);
  if (r.error) return Response.json({ error: r.error }, { status: r.status });
  return Response.json(r);
}
