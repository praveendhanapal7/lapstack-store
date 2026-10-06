import { BUSINESS } from './business';
import { sendMail } from './mail';

// Emails the shop when an order is paid, cancelled, or a sell request comes in. No key = nothing sent.
export async function alertShop(subject, lines) {
  await sendMail({ to: process.env.ALERT_EMAIL || BUSINESS.email, subject, text: lines.filter(Boolean).join('\n') });
}
