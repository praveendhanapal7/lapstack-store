import { BUSINESS } from './business';

// Emails the shop when an order is paid or a sell request comes in.
// Needs RESEND_API_KEY (resend.com). Without it, nothing is sent and nothing breaks.
export async function alertShop(subject, lines) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.ALERT_FROM || 'Lapstack <onboarding@resend.dev>',
        to: [process.env.ALERT_EMAIL || BUSINESS.email],
        subject,
        text: lines.filter(Boolean).join('\n'),
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {}
}
