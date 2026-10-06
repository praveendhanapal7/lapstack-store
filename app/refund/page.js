import Doc from '@/components/Doc';
import { BUSINESS as B } from '@/lib/business';
export const metadata = { title: 'Cancellation & refund policy — Lapstack' };
export default function Refund() {
  return (
    <Doc title="Cancellation &amp; refund policy" updated={B.updated}>
      <h2>Cancellation</h2>
      <p>You can cancel an order any time before it is shipped. Contact us on WhatsApp or email with your order number. Orders that have been shipped cannot be cancelled, but you may use the return process below.</p>
      <h2>Returns and replacement</h2>
      <p>If the laptop arrives damaged, does not match the listed specification, or has a fault, tell us within 3 days of delivery with photos or a short video. After checking, we will offer a replacement, a repair or a refund.</p>
      <p>Please keep the original packaging and do not use up the item before reporting a problem. Laptops with physical or liquid damage caused after delivery are not eligible.</p>
      <h2>Refunds</h2>
      <p>Approved refunds are sent to the original payment method within 5 to 7 business days after we receive and inspect the returned laptop.</p>
      <h2>Sold-out items</h2>
      <p>If we cannot supply an item you paid for, you will receive a full refund.</p>
      <h2>Contact</h2>
      <p>{B.email} · {B.phone}</p>
    </Doc>
  );
}
