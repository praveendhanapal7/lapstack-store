import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { q, listProducts } from '@/lib/db';
import { getAnalytics } from '@/lib/analytics';
import AdminClient from './AdminClient';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin — Lapstack' };

export default async function Admin() {
  if (!(await isAdmin())) redirect('/admin/login');
  const products = await listProducts({ all: true });
  const orders = (await q('SELECT * FROM orders ORDER BY id DESC LIMIT 200')).map((o) => ({ ...o, items: JSON.parse(o.items) }));
  const sells = (await q('SELECT * FROM sell_requests ORDER BY id DESC LIMIT 200')).map((r) => ({ ...r, photos: JSON.parse(r.photos) }));
  const claims = await q(`SELECT c.id, c.item_name, c.claim_type, c.issue, c.phone, c.status,
      to_char(c.created_at at time zone 'utc','YYYY-MM-DD HH24:MI:SS') AS created_at, o.code, o.name, o.email,
      o.created_at AS purchased_at
    FROM warranty_claims c JOIN orders o ON o.id = c.order_id ORDER BY c.id DESC LIMIT 200`);
  return <AdminClient products={products} orders={orders} sells={sells} claims={claims} stats={await getAnalytics()} />;
}
