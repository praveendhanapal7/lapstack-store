import Doc from '@/components/Doc';
import { BUSINESS as B } from '@/lib/business';
export const metadata = { title: 'Privacy policy — Lapstack' };
export default function Privacy() {
  return (
    <Doc title="Privacy policy" updated={B.updated}>
      <p>This policy explains what information {B.legalName} ("we") collects through this website and how we use it.</p>
      <h2>Information we collect</h2>
      <p>When you place an order we collect your name, phone number, delivery address and, if you choose, email. When you submit a laptop to sell, we also collect the laptop details, photos and, if provided, your purchase bill. Your cart is stored in your own browser.</p>
      <h2>Payments</h2>
      <p>Online payments are processed by Razorpay. We never see or store your card, UPI or bank details. Razorpay handles them under its own privacy policy and security standards.</p>
      <h2>How we use it</h2>
      <p>We use your information to process and deliver orders, contact you about an order or a sell request, provide support, and meet legal and accounting requirements. We do not sell your personal information.</p>
      <h2>Sharing</h2>
      <p>We share data only with service providers needed to run the store, such as the payment gateway and delivery partners, or when required by law.</p>
      <h2>Seller files</h2>
      <p>Photos and bills you upload when selling a laptop are visible only to our team and are used to evaluate and verify your laptop.</p>
      <h2>Retention and your rights</h2>
      <p>We keep order records as long as needed for legal and accounting reasons. To correct or delete your information, contact us at {B.email}.</p>
      <h2>Contact</h2>
      <p>Questions about this policy: {B.email}.</p>
    </Doc>
  );
}
