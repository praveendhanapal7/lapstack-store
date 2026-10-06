import { isAdmin } from '@/lib/auth';
import { q } from '@/lib/db';
export const dynamic = 'force-dynamic';
const ST = ['new', 'contacted', 'purchased', 'rejected'];
export async function PATCH(req, { params }) {
  if (!(await isAdmin())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  if (!ST.includes(b.status)) return Response.json({ error: 'Bad status' }, { status: 400 });
  await q('UPDATE sell_requests SET status = $1 WHERE id = $2', [b.status, Number(id)]);
  return Response.json({ ok: true });
}
