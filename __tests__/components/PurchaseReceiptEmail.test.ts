import { describe, it, expect } from 'vitest';
import React from 'react';
import PurchaseReceiptEmail from '@/components/resend/PurchaseReceiptEmail';
import { render } from '@react-email/render';

describe('PurchaseReceiptEmail component', () => {
  it('renders order details and items', async () => {
    const props = {
      orderId: 'order-123',
      customerEmail: 'buyer@example.com',
      purchasedOn: new Date('2024-01-01'),
      restaurant: { name: 'Resto', street: '1 St', city: 'Town', postalCode: '0000', country: 'X' },
      items: [{ name: 'Burger', size: 'M', quantity: 2, price: 5 }],
      taxAmount: 1,
      deliveryFee: 3,
      couponCode: 'SAVE',
      couponDiscountAmount: 2,
      couponDiscountPercentage: 10,
      specialInstructions: 'No onions, call when outside.',
      total: 12,
    };

    const element = React.createElement(PurchaseReceiptEmail, props as any);
    const html = await render(element as any);
    const output = Array.isArray(html) ? html.join('') : String(html);

    expect(output).toContain('Purchase Receipt');
    expect(output).toContain('order-123');
    expect(output).toContain('Burger');
    expect(output).toContain('No onions, call when outside.');
    expect(output).toContain('$12.00');
  });
});
