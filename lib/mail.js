// Sends email through Resend. Needs RESEND_API_KEY; set MAIL_FROM (e.g. "Lapstack <hello@lapstack.in>")
// once the domain is verified in Resend. In local dev with no key, the email is printed to the terminal.
export async function sendMail({ to, subject, text }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== 'production') { console.log(`\n[dev mail] to ${to}: ${subject}\n${text}\n`); return true; }
    return false;
  }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.MAIL_FROM || process.env.ALERT_FROM || 'Lapstack <onboarding@resend.dev>', to: [to], subject, text }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) console.error('Resend error', r.status, await r.text().catch(() => ''));
    return r.ok;
  } catch (e) { console.error('Resend failed', e.message); return false; }
}
