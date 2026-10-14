'use client';
import { useEffect, useState } from 'react';
import { inr } from '@/lib/format';

const RANGES = [['today', 'Today'], ['yesterday', 'Yesterday'], ['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['month', 'This month']];
const pct = (a, b) => (b ? Math.round((a / b) * 100) + '%' : '–');

function Kpi({ label, value, sub }) { return <div className="kpi"><span>{label}</span><b>{value}</b>{sub ? <small>{sub}</small> : null}</div>; }
function Rows({ rows, a, b, fmt }) {
  if (!rows?.length) return <p className="muted">No data yet.</p>;
  return rows.map((r, i) => <div className="line" key={i}><span>{fmt ? fmt(r) : r[a]}</span><b>{r[b]}</b></div>);
}

export default function Traffic() {
  const [range, setRange] = useState('today');
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    let off = false; setD(null); setErr('');
    fetch('/api/admin/analytics?range=' + range).then((r) => (r.ok ? r.json() : Promise.reject())).then((x) => !off && setD(x)).catch(() => !off && setErr('Could not load analytics.'));
    return () => { off = true; };
  }, [range]);

  const max = d ? Math.max(1, ...d.series.map((s) => s.sessions)) : 1;
  const funnel = d ? [['Sessions', d.sessions], ['Viewed a laptop', d.productViewers], ['Added to cart', d.cartAdders], ['Reached checkout', d.checkouts], ['Placed order (payment started)', d.ordersPlaced], ['Paid', d.ordersPaid]] : [];
  return (
    <>
      <h1>Analytics</h1>
      <div className="chips" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {RANGES.map(([id, label]) => <button key={id} className={'btn ' + (range === id ? '' : 'ghost')} style={{ padding: '8px 16px' }} onClick={() => setRange(id)}>{label}</button>)}
      </div>
      {err && <p className="muted">{err}</p>}
      {!d && !err && <p className="muted">Loading…</p>}
      {d && (
        <>
          <div className="kpis">
            <Kpi label="Sessions" value={d.sessions} sub={`${d.visitors} visitors · ${d.pageViews} page views`} />
            <Kpi label="Added to cart" value={d.cartAdders} sub={`${d.addToCartEvents} add-to-cart clicks`} />
            <Kpi label="Payment started" value={d.ordersPlaced} sub={`${d.unpaid} not paid`} />
            <Kpi label="Paid orders" value={d.ordersPaid} sub={`${inr(d.revenue)} revenue`} />
            <Kpi label="Viewed a laptop" value={d.productViewers} sub="sessions" />
            <Kpi label="Reached checkout" value={d.checkouts} sub="sessions" />
            <Kpi label="Conversion rate" value={d.conversion + '%'} sub="paid orders ÷ sessions" />
            <Kpi label="Revenue" value={inr(d.revenue)} sub={d.label} />
          </div>
          <div className="adm-grid">
            <div className="box"><h3>Sessions {d.seriesIsHours ? 'by hour' : 'by day'}</h3>
              {d.series.length ? (
                <div className="bars">{d.series.map((s) => <div key={s.d} className="bar" title={`${s.d}: ${s.sessions}`}><i style={{ height: Math.max(3, (s.sessions / max) * 100) + '%' }} /><small>{d.seriesIsHours ? s.d : s.d.slice(8)}</small></div>)}</div>
              ) : <p className="muted">No visits yet.</p>}
            </div>
            <div className="box"><h3>Shopping funnel</h3>
              {funnel.map(([l, v], i) => <div className="line" key={l}><span>{l}</span><b>{v}{i > 0 ? <small style={{ fontWeight: 400, marginLeft: 8, color: 'var(--muted)' }}>{pct(v, funnel[0][1])}</small> : null}</b></div>)}
            </div>
            <div className="box"><h3>Most viewed laptops</h3>
              <Rows rows={d.topProducts} b="views" fmt={(r) => `${r.name} · ${r.carts} in cart`} />
            </div>
            <div className="box"><h3>Where visitors come from</h3><Rows rows={d.sources} a="source" b="sessions" /></div>
            <div className="box"><h3>Top pages</h3><Rows rows={d.topPages} a="path" b="views" /></div>
            <div className="box"><h3>Devices</h3><Rows rows={d.devices} a="device" b="sessions" /></div>
          </div>
          <p className="muted" style={{ marginTop: 16 }}>Counting began when this page went live, so earlier days show zero. Times are India time. Orders and revenue come from real orders.</p>
        </>
      )}
    </>
  );
}
