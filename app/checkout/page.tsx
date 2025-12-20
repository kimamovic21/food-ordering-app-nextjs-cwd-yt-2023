'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';

const CheckoutPage = () => {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const { clearCart } = useCart();

  useEffect(() => {
    if (status === 'success') {
      clearCart();
    }
  }, [clearCart, status]);

  const isSuccess = status === 'success';
  const isCancelled = status === 'cancelled';

  return (
    <div className='max-w-2xl mx-auto text-center py-12 space-y-6'>
      <h1 className='text-3xl font-bold text-gray-800'>
        {isSuccess && 'Payment successful!'}
        {isCancelled && 'Payment cancelled'}
        {!isSuccess && !isCancelled && 'Checkout status'}
      </h1>

      <p className='text-gray-600'>
        {isSuccess && 'Thanks for your order. We are preparing your food.'}
        {isCancelled && 'Your payment was cancelled. You can return to the cart and try again.'}
        {!isSuccess && !isCancelled && 'We are processing your request. If you just paid, you will receive a confirmation shortly.'}
      </p>

      <div className='flex gap-4 justify-center'>
        <Link
          href='/menu'
          className='bg-primary text-white px-5 py-3 rounded-full font-semibold hover:bg-orange-700 transition'
        >
          Browse menu
        </Link>
        <Link
          href='/cart'
          className='border border-primary text-primary px-5 py-3 rounded-full font-semibold hover:bg-orange-50 transition'
        >
          Go to cart
        </Link>
      </div>
    </div>
  );
};

export default CheckoutPage;
