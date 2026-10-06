import Doc from '@/components/Doc';
import { BUSINESS as B } from '@/lib/business';
export const metadata = { title: 'Shipping policy — Lapstack' };
export default function Shipping() {
  return (
    <Doc title="Shipping policy" updated={B.updated}>
      <h2>Coverage</h2>
      <p>We deliver across India through trusted courier partners.</p>
      <h2>Dispatch time</h2>
      <p>Orders are dispatched within 1 to 3 business days after confirmation.</p>
      <h2>Delivery time</h2>
      <p>Delivery usually takes 3 to 7 business days depending on your location. You will receive tracking details by call, WhatsApp or email once your order ships.</p>
      <h2>Shipping charges</h2>
      <p>We do not add shipping charges unless they are shown at checkout.</p>
      <h2>On delivery</h2>
      <p>Please check the package for damage before accepting it. If it looks tampered with or damaged, record a short video while opening it and contact us right away.</p>
      <h2>Contact</h2>
      <p>{B.email} · {B.phone}</p>
    </Doc>
  );
}
