import Doc from '@/components/Doc';
import { BUSINESS as B } from '@/lib/business';
export const metadata = { title: 'Warranty policy — Lapstack' };
export default function Warranty() {
  return (
    <Doc title="Warranty policy" updated={B.updated}>
      <p className="lead">Every laptop from Lapstack comes with a 6 month warranty, counted from the purchase date.</p>
      <h2>Months 1 to 3: full warranty</h2>
      <p>If the laptop has a hardware fault in normal use, we repair or replace it. You pay nothing.</p>
      <h2>Months 4 to 6: service support</h2>
      <p>Our service charge is zero. If a spare part has to be replaced, you pay only for the spare part.</p>
      <h2>How to claim</h2>
      <p>Sign in to your account, open <a href="/account">My account</a>, go to Orders, and press <b>Claim full warranty</b> (first 3 months) or <b>Claim service support</b> (next 3 months). Tell us the problem. Our team will contact you soon. To speed things up, call or WhatsApp us on {B.phone}.</p>
      <h2>What is not covered</h2>
      <p>Physical damage, liquid damage, misuse, and repairs done by anyone other than us.</p>
      <h2>After 6 months</h2>
      <p>The warranty ends. You can still contact us for paid service.</p>
      <h2>Contact</h2>
      <p>{B.email} · {B.phone}</p>
    </Doc>
  );
}
