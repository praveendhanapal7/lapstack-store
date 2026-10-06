'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
const Ctx = createContext(null);
export const useCart = () => useContext(Ctx);

export default function CartProvider({ children }) {
  // items: [{id, qty}] — prices/stock always re-read from server
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem('ls_cart') || '[]')); } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) try { localStorage.setItem('ls_cart', JSON.stringify(items)); } catch {}
  }, [items, ready]);

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
