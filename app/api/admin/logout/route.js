import { clearAdminCookie } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export async function POST() {
  await clearAdminCookie();
  return Response.json({ ok: true });
}
