import { razorpayEnabled } from '@/lib/razorpay';
export const dynamic = 'force-dynamic';
export async function GET() {
  return Response.json({ razorpay: razorpayEnabled(), keyId: razorpayEnabled() ? process.env.RAZORPAY_KEY_ID : null });
}
