import Doc from '@/components/Doc';
import { BUSINESS as B } from '@/lib/business';
export const metadata = { title: 'Terms & conditions — Lapstack' };
export default function Terms() {
  return (
    <Doc title="Terms &amp; conditions" updated={B.updated}>
      <p>By using this website and placing an order you agree to these terms.</p>
      <h2>Products</h2>
      <p>All laptops are refurbished or pre-owned unless stated. Specifications, condition and warranty are listed on each product page. Photos show the model and may not be the exact unit; contact us for photos of the exact unit.</p>
      <h2>Pricing and availability</h2>
      <p>Prices are in Indian Rupees. Each laptop is a single unit unless the stock shows more, so availability can change. If an item sells out before we confirm your order, we will refund any payment in full.</p>
      <h2>Orders and payment</h2>
      <p>An order is confirmed when payment is received. We may cancel an order if the details look incorrect or the item is unavailable.</p>
      <h2>Warranty</h2>
      <p>Where a warranty is stated on the product page, it covers hardware faults arising in normal use during the stated period. It does not cover physical or liquid damage, or misuse.</p>
      <h2>Selling to us</h2>
      <p>Offers are based on the information and photos you submit and are subject to inspection. You confirm that you own the laptop and that the details you provide are accurate. We may decline any request.</p>
      <h2>Liability</h2>
      <p>Our liability is limited to the amount paid for the product in question. These terms are governed by the laws of India.</p>
      <h2>Contact</h2>
      <p>{B.legalName} · {B.email} · {B.phone}</p>
    </Doc>
  );
}
