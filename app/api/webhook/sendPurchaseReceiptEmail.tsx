import { Resend } from 'resend';
import { render } from '@react-email/render';
import PurchaseReceiptEmail from '@/components/resend/PurchaseReceiptEmail';
import type { PurchaseReceiptProps } from '@/types/receipt';

type SendPurchaseReceiptEmailArgs = PurchaseReceiptProps;

export async function sendPurchaseReceiptEmail({
  orderId,
  customerEmail,
  purchasedOn,
  restaurant,
  items,
  taxAmount,
  deliveryFee,
  couponCode,
  couponDiscountAmount,
  couponDiscountPercentage,
  specialInstructions,
  total,
}: SendPurchaseReceiptEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
  const to = process.env.RESEND_RECEIVER_EMAIL || customerEmail;

  if (!apiKey) {
    return { sent: false, reason: 'missing_api_key' as const };
  }

  const resend = new Resend(apiKey);

  try {
    const emailComponent = (
      <PurchaseReceiptEmail
        orderId={orderId}
        customerEmail={customerEmail}
        purchasedOn={purchasedOn}
        restaurant={restaurant}
        items={items}
        taxAmount={taxAmount}
        deliveryFee={deliveryFee}
        couponCode={couponCode}
        couponDiscountAmount={couponDiscountAmount || 0}
        couponDiscountPercentage={couponDiscountPercentage || 0}
        specialInstructions={specialInstructions}
        total={total}
      />
    );

    const html = await render(emailComponent);

    const response = await resend.emails.send({
      from,
      to: [to],
      subject: `Payment received - Order ${orderId.slice(-8)}`,
      html,
    });

    if ((response as any)?.error) {
      console.error('Resend email API returned an error:', (response as any).error);
      return { sent: false, reason: 'send_failed' as const, error: (response as any).error };
    }

    return { sent: true, response };
  } catch (error) {
    console.error('Failed to send purchase receipt email:', error);
    return { sent: false, reason: 'send_failed' as const, error };
  }
}
