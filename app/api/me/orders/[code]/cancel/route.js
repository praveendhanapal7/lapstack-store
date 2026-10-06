import { getUser } from '@/lib/customer';
import { cancelCustomerOrder } from '@/lib/orders';
export const dynamic = 'force-dynamic';
export async function POST(req, { params }) {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });
  const r = await cancelCustomerOrder(user, String((await params).code));
  if (r.error) return Response.json({ error: r.error }, { status: r.status });
  return Response.json(r);
}
