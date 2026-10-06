import { isAdmin } from '@/lib/auth';
import { q } from '@/lib/db';
import { CLAIM_STATUS } from '@/lib/warranty';
export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
  if (!(await isAdmin())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { status } = await req.json().catch(() => ({}));
  if (!CLAIM_STATUS.includes(status)) return Response.json({ error: 'Bad status' }, { status: 400 });
  await q('UPDATE warranty_claims SET status = $1 WHERE id = $2', [status, Number((await params).id)]);
  return Response.json({ ok: true });
}
