import { clearUserCookie } from '@/lib/customer';
export const dynamic = 'force-dynamic';
export async function POST() {
  await clearUserCookie();
  return Response.json({ ok: true });
}
