import { checkPassword, setAdminCookie } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export async function POST(req) {
  const { password } = await req.json().catch(() => ({}));
  if (!checkPassword(password)) return Response.json({ error: 'Wrong password' }, { status: 401 });
  await setAdminCookie();
  return Response.json({ ok: true });
}
