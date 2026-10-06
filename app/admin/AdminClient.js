'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { upload as blobUpload } from '@vercel/blob/client';
import { inr } from '@/lib/format';

const ORDER_ST = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const PAY_ST = ['pending', 'paid', 'failed', 'refunded'];
const SELL_ST = ['new', 'contacted', 'purchased', 'rejected'];
const blank = { name: '', cpu: '', ram: '', storage: '', display: '', price: '', stock: 1, image: '', note: '', warranty: false, active: true };
const post = (url, method, body) => fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
const fmt = (d) => new Date(d.replace(' ', 'T') + 'Z').toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

function Kpi({ label, value, sub, tone }) {
  return <div className={'kpi ' + (tone || '')}><span>{label}</span><b>{value}</b>{sub ? <small>{sub}</small> : null}</div>;
}

function Bars({ days, field, money }) {
  const max = Math.max(1, ...days.map((d) => d[field]));
  return (
    <div className="bars">
      {days.map((d) => (
        <div key={d.d} className="bar" title={`${d.d}: ${money ? inr(d[field]) : d[field]}`}>
          <i style={{ height: Math.max(3, (d[field] / max) * 100) + '%' }} />
          <small>{d.d.slice(8)}</small>
        </div>
      ))}
    </div>
  );
}

export default function AdminClient({ products, orders, sells, stats }) {
  const router = useRouter();
  const [tab, setTab] = useState('dashboard');
  const [edit, setEdit] = useState(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [payFilter, setPayFilter] = useState('all');
  const [ordFilter, setOrdFilter] = useState('all');
  const refresh = () => router.refresh();
  const { k } = stats;

  async function logout() { await post('/api/admin/logout', 'POST'); router.push('/admin/login'); router.refresh(); }
  async function patchOrder(id, body) { await post('/api/admin/orders/' + id, 'PATCH', body); refresh(); }
  async function patchSell(id, status) { await post('/api/admin/sell/' + id, 'PATCH', { status }); refresh(); }
  async function save() {
    setErr('');
    const r = await post(edit.id ? '/api/admin/products/' + edit.id : '/api/admin/products', edit.id ? 'PUT' : 'POST', edit);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setErr(d.error || 'Could not save');
    setEdit(null); refresh();
  }
  async function quick(p, patch) { await post('/api/admin/products/' + p.id, 'PUT', { ...p, warranty: !!p.warranty, active: !!p.active, ...patch }); refresh(); }
  async function remove(p) { await fetch('/api/admin/products/' + p.id + '?hard=1', { method: 'DELETE' }); setConfirmDel(null); refresh(); }
  async function upload(file) {
    if (!file) return;
    try {
      const r = await blobUpload('products/' + file.name.replace(/[^\w.-]+/g, '_'), file, { access: 'public', handleUploadUrl: '/api/blob/upload' });
      setEdit((e) => ({ ...e, image: r.url }));
    } catch (x) { setErr(x.message || 'Upload failed'); }
  }
  const s = (key) => (e) => setEdit({ ...edit, [key]: e.target.value });

  const shownProducts = useMemo(() => products.filter((p) => !q || (p.name + p.cpu).toLowerCase().includes(q.toLowerCase())), [products, q]);
  const shownPay = useMemo(() => orders.filter((o) => payFilter === 'all' || o.payment_status === payFilter), [orders, payFilter]);
  const shownOrders = useMemo(() => orders.filter((o) => ordFilter === 'all' || o.order_status === ordFilter), [orders, ordFilter]);

  function exportCsv() {
    const head = ['Date', 'Order', 'Customer', 'Phone', 'Method', 'Payment status', 'Order status', 'Amount', 'Razorpay order', 'Razorpay payment'];
    const rows = shownPay.map((o) => [o.created_at, o.code, o.name, o.phone, o.method, o.payment_status, o.order_status, o.total, o.razorpay_order_id || '', o.razorpay_payment_id || '']);
    const csv = [head, ...rows].map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'lapstack-payments.csv'; a.click();
  }

  const NAV = [['dashboard', 'Dashboard'], ['orders', 'Orders'], ['products', 'Products'], ['payments', 'Payments'], ['sell', 'Sell requests']];
  const badge = { orders: k.newOrders, sell: k.newSell };

  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-brand"><img src="/logo.png" alt="" /> Lapstack <small>Admin</small></div>
        <nav>
          {NAV.map(([id, label]) => (
            <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}{badge[id] ? <em>{badge[id]}</em> : null}</button>
          ))}
        </nav>
        <a href="/" target="_blank" className="adm-link">View store ↗</a>
        <button className="adm-link" onClick={logout}>Log out</button>
      </aside>

      <main className="adm-main">
        {tab === 'dashboard' && (
          <>
            <h1>Dashboard</h1>
            <div className="kpis">
              <Kpi label="Revenue" value={inr(k.revenue)} sub="Paid orders, excl. cancelled" tone="y" />
              <Kpi label="Total orders" value={k.totalOrders} sub={`${k.todayOrders} today`} />
              <Kpi label="Need action" value={k.newOrders} sub="New orders to confirm" />
              <Kpi label="Avg. order value" value={inr(k.avgOrder)} />
              <Kpi label="Paid online" value={inr(k.onlinePaid)} />
              <Kpi label="To ship" value={k.toShip} sub="Paid and confirmed" />
              <Kpi label="Payment pending" value={inr(k.pendingPay)} />
              <Kpi label="Refunded" value={inr(k.refunded)} />
            </div>
            <div className="adm-grid">
              <div className="box"><h3>Orders, last 14 days</h3><Bars days={stats.days} field="n" /></div>
              <div className="box"><h3>Revenue, last 14 days</h3><Bars days={stats.days} field="rev" money /></div>
              <div className="box"><h3>Orders by status</h3>
                {stats.byStatus.map((r) => <div className="line" key={r.s}><span className={'tag ' + r.s}>{r.s}</span><b>{r.c}</b></div>)}
                {!stats.byStatus.length && <p className="muted">No orders yet.</p>}
              </div>
              <div className="box"><h3>Best sellers</h3>
                {stats.top.map((t) => <div className="line" key={t.name}><span>{t.name}</span><b>{t.qty}</b></div>)}
                {!stats.top.length && <p className="muted">No sales yet.</p>}
              </div>
              <div className="box"><h3>Stock alerts</h3>
                <p className="muted" style={{ marginTop: 0 }}>{k.liveProducts} live · {k.soldOut} sold out</p>
                {stats.lowStock.map((p) => <div className="line" key={p.id}><span>{p.name}</span><b style={{ color: p.stock < 1 ? 'var(--red)' : undefined }}>{p.stock < 1 ? 'Sold out' : p.stock + ' left'}</b></div>)}
              </div>
              <div className="box"><h3>Payment methods</h3>
                {stats.byMethod.map((r) => <div className="line" key={r.m}><span>{r.m === 'cod' ? 'Cash on delivery' : 'Online (Razorpay)'} · {r.c} orders</span><b>{inr(r.amt)}</b></div>)}
                {!stats.byMethod.length && <p className="muted">No orders yet.</p>}
              </div>
            </div>
          </>
        )}

        {tab === 'orders' && (
          <>
            <h1>Orders</h1>
            <div className="filters">{['all', ...ORDER_ST].map((x) => <button key={x} className={'chip' + (ordFilter === x ? ' on' : '')} onClick={() => setOrdFilter(x)}>{x}</button>)}</div>
            <div className="scroll"><table className="tbl">
              <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
              <tbody>
                {shownOrders.map((o) => (
                  <tr key={o.id}>
                    <td><b>{o.code}</b><br /><small>{fmt(o.created_at)}</small></td>
                    <td>{o.name}<br /><a href={'tel:' + o.phone}>{o.phone}</a>{o.email ? <><br /><small>{o.email}</small></> : null}<br /><small>{o.address}, {o.city} {o.pincode}</small></td>
                    <td>{o.items.map((i) => <div key={i.id}>{i.name} × {i.qty}</div>)}</td>
                    <td><b>{inr(o.total)}</b></td>
                    <td><span className={'tag ' + o.payment_status}>{o.payment_status}</span></td>
                    <td><select className="inp" value={o.order_status} onChange={(e) => patchOrder(o.id, { order_status: e.target.value })}>{ORDER_ST.map((x) => <option key={x}>{x}</option>)}</select></td>
                  </tr>
                ))}
                {!shownOrders.length && <tr><td colSpan={6} className="empty">No orders.</td></tr>}
              </tbody>
            </table></div>
          </>
        )}

        {tab === 'payments' && (
          <>
            <div className="adm-head"><h1>Payments</h1><button className="btn sm ghost" onClick={exportCsv}>Export CSV</button></div>
            <div className="kpis">
              <Kpi label="Received online" value={inr(k.onlinePaid)} tone="y" />
              <Kpi label="Failed" value={inr(k.failed)} />
              <Kpi label="Pending" value={inr(k.pendingPay)} />
              <Kpi label="Refunded" value={inr(k.refunded)} />
            </div>
            <div className="filters">{['all', ...PAY_ST].map((x) => <button key={x} className={'chip' + (payFilter === x ? ' on' : '')} onClick={() => setPayFilter(x)}>{x}</button>)}</div>
            <div className="scroll"><table className="tbl">
              <thead><tr><th>Date</th><th>Order</th><th>Customer</th><th>Method</th><th>Amount</th><th>Razorpay IDs</th><th>Status</th></tr></thead>
              <tbody>
                {shownPay.map((o) => (
                  <tr key={o.id}>
                    <td><small>{fmt(o.created_at)}</small></td>
                    <td><b>{o.code}</b></td>
                    <td>{o.name}<br /><small>{o.phone}</small></td>
                    <td>{o.method === 'cod' ? 'Cash on delivery' : 'Razorpay'}</td>
                    <td><b>{inr(o.total)}</b></td>
                    <td><small>{o.razorpay_order_id || '—'}<br />{o.razorpay_payment_id || ''}</small></td>
                    <td><select className="inp" value={o.payment_status} onChange={(e) => patchOrder(o.id, { payment_status: e.target.value })}>{PAY_ST.map((x) => <option key={x}>{x}</option>)}</select></td>
                  </tr>
                ))}
                {!shownPay.length && <tr><td colSpan={7} className="empty">No payments.</td></tr>}
              </tbody>
            </table></div>
            <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>Online payments are marked paid automatically once Razorpay confirms them. To refund an online payment, refund it in the Razorpay dashboard, then set the status to refunded here.</p>
          </>
        )}

        {tab === 'products' && (
          <>
            <div className="adm-head"><h1>Products</h1><button className="btn sm" onClick={() => { setErr(''); setEdit({ ...blank }); }}>+ Add laptop</button></div>
            <input className="inp" style={{ maxWidth: 360, marginBottom: 16 }} placeholder="Search laptops…" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="scroll"><table className="tbl">
              <thead><tr><th></th><th>Laptop</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {shownProducts.map((p) => (
                  <tr key={p.id} style={{ opacity: p.active ? 1 : .55 }}>
                    <td>{p.image ? <img src={p.image} alt="" style={{ width: 60, height: 45, objectFit: 'cover', borderRadius: 8 }} /> : null}</td>
                    <td><b>{p.name}</b><br /><small>{[p.cpu, p.ram, p.storage].filter(Boolean).join(' · ')}</small></td>
                    <td>{inr(p.price)}</td>
                    <td><div className="qty"><button onClick={() => quick(p, { stock: Math.max(0, p.stock - 1) })}>−</button><span>{p.stock}</span><button onClick={() => quick(p, { stock: p.stock + 1 })}>+</button></div></td>
                    <td>{p.active ? <span className="tag paid">Live</span> : <span className="tag">Hidden</span>}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {confirmDel === p.id ? (
                        <><button className="btn sm danger" onClick={() => remove(p)}>Yes, delete</button>{' '}<button className="btn sm ghost" onClick={() => setConfirmDel(null)}>No</button></>
                      ) : (
                        <>
                          <button className="btn sm ghost" onClick={() => { setErr(''); setEdit({ ...p, warranty: !!p.warranty, active: !!p.active }); }}>Edit</button>{' '}
                          <button className="btn sm ghost" onClick={() => quick(p, { active: !p.active })}>{p.active ? 'Hide' : 'Show'}</button>{' '}
                          <button className="btn sm danger" onClick={() => setConfirmDel(p.id)}>Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {!shownProducts.length && <tr><td colSpan={6} className="empty">No laptops found.</td></tr>}
              </tbody>
            </table></div>
            <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>Hide keeps a laptop in the system but off the store. Delete removes it permanently; past orders keep their details.</p>
          </>
        )}

        {tab === 'sell' && (
          <>
            <h1>Sell requests</h1>
            <div style={{ display: 'grid', gap: 16 }}>
              {sells.map((r) => (
                <div className="box" key={r.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div><b style={{ fontSize: 18 }}>{r.brand} {r.model}</b><br /><small>{fmt(r.created_at)} · {r.name} · <a href={'tel:' + r.phone}>{r.phone}</a>{r.email ? ' · ' + r.email : ''}{r.city ? ' · ' + r.city : ''}</small></div>
                    <select className="inp" style={{ width: 160 }} value={r.status} onChange={(e) => patchSell(r.id, e.target.value)}>{SELL_ST.map((x) => <option key={x}>{x}</option>)}</select>
                  </div>
                  <p style={{ margin: '10px 0' }}>{[r.cpu, r.ram, r.storage, r.condition].filter(Boolean).join(' · ')}<br />Purchased: {r.purchase_date || 'not given'} · Expected: {r.expected_price ? inr(r.expected_price) : 'not given'}</p>
                  {r.notes ? <p className="muted">{r.notes}</p> : null}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {r.photos.map((n) => <a key={n} href={'/api/admin/sell-file?u=' + encodeURIComponent(n)} target="_blank"><img src={'/api/admin/sell-file?u=' + encodeURIComponent(n)} alt="" style={{ width: 96, height: 72, objectFit: 'cover', borderRadius: 10 }} /></a>)}
                    {r.bill ? <a className="btn sm ghost" href={'/api/admin/sell-file?u=' + encodeURIComponent(r.bill)} target="_blank">View bill</a> : null}
                  </div>
                </div>
              ))}
              {!sells.length && <p className="empty">No sell requests yet.</p>}
            </div>
          </>
        )}
      </main>

      {edit && (
        <div className="modal" onClick={(e) => e.target === e.currentTarget && setEdit(null)}>
          <div className="panel">
            <h3 style={{ marginBottom: 12 }}>{edit.id ? 'Edit laptop' : 'Add laptop'}</h3>
            {err ? <div className="err">{err}</div> : null}
            <label className="f">Name<input value={edit.name} onChange={s('name')} /></label>
            <div className="row2">
              <label className="f">Processor<input value={edit.cpu} onChange={s('cpu')} /></label>
              <label className="f">Display<input value={edit.display} onChange={s('display')} /></label>
              <label className="f">RAM<input value={edit.ram} onChange={s('ram')} /></label>
              <label className="f">Storage<input value={edit.storage} onChange={s('storage')} /></label>
              <label className="f">Price (₹)<input type="number" value={edit.price} onChange={s('price')} /></label>
              <label className="f">Stock<input type="number" min="0" value={edit.stock} onChange={s('stock')} /></label>
            </div>
            <label className="f">Note<input value={edit.note} onChange={s('note')} /></label>
            <label className="f">Image<input type="file" accept="image/*" onChange={(e) => upload(e.target.files[0])} /></label>
            {edit.image ? <img src={edit.image} alt="" style={{ width: 120, borderRadius: 8, marginBottom: 12 }} /> : null}
            <label style={{ display: 'flex', gap: 8, marginBottom: 6 }}><input type="checkbox" checked={edit.warranty} onChange={(e) => setEdit({ ...edit, warranty: e.target.checked })} /> Warranty included</label>
            <label style={{ display: 'flex', gap: 8, marginBottom: 16 }}><input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} /> Visible in store</label>
            <div style={{ display: 'flex', gap: 10 }}><button className="btn" onClick={save}>Save</button><button className="btn ghost" onClick={() => setEdit(null)}>Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
