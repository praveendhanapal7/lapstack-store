import { isAdmin } from '@/lib/auth';
import { approveRefund } from '@/lib/orders';
export const dynamic = 'force-dynamic';

// Admin only: approve a customer's cancellation refund and send the money back through Razorpay.
export async function POST(req, { params }) {
  if (!(await isAdmin())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const r = await approveRefund(Number((await params).id));
  if (r.error) return Response.json({ error: r.error }, { status: r.status });
  return Response.json({ ok: true });
}
