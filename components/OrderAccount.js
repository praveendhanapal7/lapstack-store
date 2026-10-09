'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth, SignIn } from './Auth';

// Shown on the order page after paying: create an account (same email) to track, cancel and claim warranty.
export default function OrderAccount({ email }) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  if (user === undefined) return null;
  if (user) return <a className="btn ghost" href="/account" style={{ marginBottom: 12 }}>View this order in my account</a>;
  return (
    <div className="panel acctbox">
      <h3>Create your free account</h3>
      <ul>
        <li>📦 Track this order</li>
        <li>🛡️ Claim your 6-month warranty</li>
      </ul>
      {open
        ? <SignIn title="Confirm your email" button="Send me a code" note={`Use the email from your order (${email}). We will send a 6-digit code, and this order is added to your account automatically.`} onDone={() => router.refresh()} />
        : <button className="btn" style={{ width: '100%' }} onClick={() => setOpen(true)}>Sign up with my email</button>}
    </div>
  );
}
