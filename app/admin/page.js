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
  return <AdminClient products={products} orders={orders} sells={sells} stats={await getAnalytics()} />;
}
