'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function Login() {
  const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const router = useRouter();
  async function go(e) {
    e.preventDefault(); setErr('');
    const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
    if (r.ok) { router.push('/admin'); router.refresh(); } else setErr('Wrong password');
  }
  return (
    <div className="wrap" style={{ maxWidth: 420, padding: '80px 20px' }}>
      <form className="panel" onSubmit={go}>
        <h1 style={{ fontSize: 30, marginBottom: 16 }}>Admin login</h1>
        {err ? <div className="err">{err}</div> : null}
        <label className="f">Password<input type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} /></label>
        <button className="btn" style={{ width: '100%' }}>Sign in</button>
      </form>
    </div>
  );
}
