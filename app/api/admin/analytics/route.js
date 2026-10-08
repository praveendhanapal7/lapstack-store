import { isAdmin } from '@/lib/auth';
import { getTraffic } from '@/lib/traffic';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  if (!(await isAdmin())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  return Response.json(await getTraffic(new URL(req.url).searchParams.get('range') || 'today'));
}
