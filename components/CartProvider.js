'use client';
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './Auth';
const Ctx = createContext(null);
export const useCart = () => useContext(Ctx);

export default function CartProvider({ children }) {
  // items: [{id, qty}] — prices/stock always re-read from server
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const { user } = useAuth();
  const [synced, setSynced] = useState(false); // true once this browser's cart has been merged with the account cart
  const wasIn = useRef(false);
  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem('ls_cart') || '[]')); } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) try { localStorage.setItem('ls_cart', JSON.stringify(items)); } catch {}
  }, [items, ready]);

  // Signed in: merge the account cart with this browser's cart, then keep the account cart up to date.
  useEffect(() => {
    if (!ready || user === undefined) return;
    if (!user) {
      if (wasIn.current) { setItems([]); wasIn.current = false; } // signed out: clear the cart on this device
      setSynced(false); return;
    }
    wasIn.current = true;
    let live = true;
    fetch('/api/me/cart', { cache: 'no-store' }).then((r) => r.json()).then((d) => {
      if (!live) return;
      setItems((cur) => {
        const m = new Map();
        for (const i of [...(d.items || []), ...cur]) m.set(i.id, { id: i.id, qty: Math.max(m.get(i.id)?.qty || 0, i.qty) });
        return [...m.values()];
      });
      setSynced(true);
    }).catch(() => setSynced(true));
    return () => { live = false; };
  }, [ready, user?.id]); // eslint-disable-line
  useEffect(() => {
    if (!user || !synced) return;
    const t = setTimeout(() => fetch('/api/me/cart', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) }).catch(() => {}), 600);
    return () => clearTimeout(t);
  }, [items, synced, user?.id]); // eslint-disable-line

  const add = useCallback((id, qty = 1, max = 99) =>
    setItems((cur) => {
      const f = cur.find((i) => i.id === id);
      if (f) return cur.map((i) => (i.id === id ? { ...i, qty: Math.min(max, i.qty + qty) } : i));
      return [...cur, { id, qty: Math.min(max, qty) }];
    }), []);
  const setQty = useCallback((id, qty) =>
    setItems((cur) => cur.map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i))), []);
  const remove = useCallback((id) => setItems((cur) => cur.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);
  const count = items.reduce((s, i) => s + i.qty, 0);
  return <Ctx.Provider value={{ items, add, setQty, remove, clear, count, ready }}>{children}</Ctx.Provider>;
}
