import { getUser } from '@/lib/customer';
import { listOrdersForUser } from '@/lib/orders';
export const dynamic = 'force-dynamic';
export async function GET() {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });
  return Response.json({ orders: await listOrdersForUser(user.id) });
}
