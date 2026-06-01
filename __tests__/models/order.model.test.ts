import { describe, it, expect } from 'vitest';
import { Order } from '@/models/order';

describe('Order model validation', () => {
  it('rejects creation when required fields are missing', async () => {
    const o: any = new Order({});
    await expect(o.validate()).rejects.toBeTruthy();
  });

  it('rejects invalid taxPercentage values', async () => {
    const data: any = {
      email: 'a@b.com',
      phone: '123',
      streetAddress: 'addr',
      postalCode: '00000',
      city: 'C',
      country: 'X',
      cartProducts: [
        {
          productId: '507f1f77bcf86cd799439011',
          name: 'X',
          size: 'M',
          quantity: 1,
          price: 10,
          restaurantId: '507f1f77bcf86cd799439011',
        },
      ],
      restaurantId: '507f1f77bcf86cd799439011',
      taxPercentage: 200,
      deliveryFee: 5,
      total: 10,
    };

    const o: any = new Order(data);
    await expect(o.validate()).rejects.toBeTruthy();
  });

  it('validates a minimal valid order', async () => {
    const data: any = {
      email: 'a@b.com',
      phone: '123',
      streetAddress: 'addr',
      postalCode: '00000',
      city: 'C',
      country: 'X',
      cartProducts: [
        {
          productId: '507f1f77bcf86cd799439011',
          name: 'X',
          size: 'M',
          quantity: 1,
          price: 10,
          restaurantId: '507f1f77bcf86cd799439011',
        },
      ],
      restaurantId: '507f1f77bcf86cd799439011',
      taxPercentage: 10,
      deliveryFee: 5,
      total: 10,
    };

    const o: any = new Order(data);
    await expect(o.validate()).resolves.toBeUndefined();
  });
});
