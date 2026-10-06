'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

// user: undefined while loading, null when signed out.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const [addresses, setAddresses] = useState([]);
  const refresh = useCallback(async () => {
    try {
      const d = await (await fetch('/api/me', { cache: 'no-store' })).json();
      setUser(d.user || null); setAddresses(d.addresses || []);
      return d;
    } catch { setUser(null); return { user: null, addresses: [] }; }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null); setAddresses([]);
  }, []);
  return <Ctx.Provider value={{ user, addresses, refresh, logout }}>{children}</Ctx.Provider>;
}

const post = async (url, body) => {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Something went wrong. Please try again.');
  return d;
};

/** Two steps: enter email, then the 6-digit code we email. */
export function SignIn({ title = 'Sign in', note, onDone }) {
  const { refresh } = useAuth();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t); }, [wait]);

  async function send(e) {
    e?.preventDefault(); setErr(''); setBusy(true);
    try { await post('/api/auth/request', { email }); setStep('code'); setCode(''); setWait(45); }
    catch (x) { setErr(x.message); }
    setBusy(false);
  }
  async function verify(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await post('/api/auth/verify', { email, code }); const d = await refresh(); onDone?.(d); }
    catch (x) { setErr(x.message); setBusy(false); }
  }
  return (
    <div className="panel signin">
      <h3>{title}</h3>
      {note ? <p className="muted">{note}</p> : null}
      {err ? <div className="err">{err}</div> : null}
      {step === 'email' ? (
        <form onSubmit={send}>
          <label className="f">Your email<input type="email" required autoComplete="email" inputMode="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <button className="btn" style={{ width: '100%' }} disabled={busy}>{busy ? 'Sending…' : 'Email me a code'}</button>
          <p className="muted small">No password needed. We will email you a 6-digit code.</p>
        </form>
      ) : (
        <form onSubmit={verify}>
          <p className="muted">We sent a 6-digit code to <b>{email}</b>. It can take a minute; check spam too.</p>
          <label className="f">6-digit code<input className="codebox" required autoFocus autoComplete="one-time-code" inputMode="numeric" maxLength={6} placeholder="······" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} /></label>
          <button className="btn" style={{ width: '100%' }} disabled={busy || code.length !== 6}>{busy ? 'Checking…' : 'Verify and continue'}</button>
          <p className="muted small">
            <button type="button" className="linkbtn" disabled={wait > 0 || busy} onClick={send}>{wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}</button>
            {' · '}
            <button type="button" className="linkbtn" onClick={() => { setStep('email'); setErr(''); }}>Change email</button>
          </p>
        </form>
      )}
    </div>
  );
}
