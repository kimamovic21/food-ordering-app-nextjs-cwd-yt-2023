'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { formatAppDate } from '@/libs/dateFormat';
import Link from 'next/link';
import type { ReceiptResponse } from '@/types/receipt';

type DocumentWithViewTransition = Document & {
  startViewTransition?: (updateCallback: () => void) => void;
};

const formatMoney = (amount: number) => `$${(Number(amount) || 0).toFixed(2)}`;

const CheckoutContent = () => {
  const searchParams = useSearchParams();
  const status = searchParams?.get ? searchParams.get('status') : undefined;
  const sessionId = searchParams?.get ? searchParams.get('session_id') : undefined;
  const { clearCart } = useCart();
  const [receipt, setReceipt] = useState<ReceiptResponse | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  useEffect(() => {
    if (status === 'success') {
      clearCart();
    }
  }, [clearCart, status]);

  useEffect(() => {
    if (status !== 'success' || !sessionId) {
      return;
    }

    let isMounted = true;

    const fetchReceipt = async () => {
      setLoadingReceipt(true);
      try {
        const response = await fetch(`/api/my-orders?sessionId=${encodeURIComponent(sessionId)}`);

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as ReceiptResponse;
        if (!isMounted || !data?.order) {
          return;
        }

        const enhancedDocument = document as DocumentWithViewTransition;
        if (typeof enhancedDocument.startViewTransition === 'function') {
          enhancedDocument.startViewTransition(() => {
            setReceipt(data);
          });
          return;
        }

        setReceipt(data);
      } finally {
        if (isMounted) {
          setLoadingReceipt(false);
        }
      }
    };

    fetchReceipt();

    return () => {
      isMounted = false;
    };
  }, [sessionId, status]);

  const isSuccess = status === 'success';
  const isCancelled = status === 'cancelled';
  const purchasedOn = receipt?.order?.updatedAt || receipt?.order?.createdAt;
  const restaurantAddress = [
    receipt?.restaurant?.street,
    receipt?.restaurant?.postalCode,
    receipt?.restaurant?.city,
    receipt?.restaurant?.country,
  ]
    .filter(Boolean)
    .join(', ');

  const itemsTotal = useMemo(() => {
    if (!receipt?.receiptItems?.length) {
      return 0;
    }

    return receipt.receiptItems.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      return sum + price * quantity;
    }, 0);
  }, [receipt]);

  const couponDiscountAmount = Number(receipt?.order?.couponDiscountAmount || 0);
  const foodTotal = Math.max(0, itemsTotal - couponDiscountAmount);

  return (
    <div className='max-w-3xl mx-auto py-10 px-4 space-y-6'>
      <h1 className='text-4xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>
        {isSuccess && 'Payment successful'}
        {isCancelled && 'Payment cancelled'}
        {!isSuccess && !isCancelled && 'Checkout status'}
      </h1>

      <p className='text-gray-600 dark:text-gray-300'>
        {isSuccess && 'Thanks for your order. Your receipt is shown below.'}
        {isCancelled && 'Your payment was cancelled. You can return to the cart and try again.'}
        {!isSuccess &&
          !isCancelled &&
          'We are processing your request. If you just paid, you will receive a confirmation shortly.'}
      </p>

      {isSuccess && loadingReceipt && (
        <div className='rounded-2xl border border-gray-200 bg-white p-6 text-gray-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'>
          Loading your purchase receipt...
        </div>
      )}

      {isSuccess && receipt?.order && (
        <section className='rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 text-sm'>
            <div>
              <p className='text-gray-500'>Order ID</p>
              <p className='font-medium text-gray-900 dark:text-gray-100 break-all'>
                {receipt.order._id}
              </p>
            </div>
            <div>
              <p className='text-gray-500'>Purchased On</p>
              <p className='font-medium text-gray-900 dark:text-gray-100'>
                {formatAppDate(purchasedOn)}
              </p>
            </div>
          </div>

          {receipt?.restaurant?.name ? (
            <div className='mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/40'>
              <p className='text-gray-500 text-sm'>Restaurant</p>
              <p className='font-medium text-gray-900 dark:text-gray-100 mt-1'>
                {receipt.restaurant.name}
              </p>
              {restaurantAddress ? (
                <p className='text-sm text-gray-600 dark:text-gray-300 mt-1'>{restaurantAddress}</p>
              ) : null}
              {receipt.restaurant.contact ? (
                <p className='text-sm text-gray-600 dark:text-gray-300 mt-1'>
                  Contact: {receipt.restaurant.contact}
                </p>
              ) : null}
              {receipt.restaurant.email ? (
                <p className='text-sm text-gray-600 dark:text-gray-300 mt-1'>
                  Email: {receipt.restaurant.email}
                </p>
              ) : null}
            </div>
          ) : null}

          {receipt.order.specialInstructions ? (
            <div className='mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/40'>
              <p className='text-gray-500 text-sm'>Special instructions</p>
              <p className='mt-1 whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100'>
                {receipt.order.specialInstructions}
              </p>
            </div>
          ) : null}

          <div className='mt-6 rounded-2xl border border-gray-200 p-4 dark:border-neutral-700 dark:bg-neutral-900'>
            <div className='space-y-4'>
              {(receipt.receiptItems || []).map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className='flex items-start justify-between gap-4'
                >
                  <div className='flex items-start gap-3'>
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.name}
                        className='h-16 w-16 rounded-xl border border-gray-200 object-cover dark:border-neutral-700'
                      />
                    ) : (
                      <div className='h-16 w-16 rounded-xl border border-gray-200 bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800' />
                    )}

                    <div>
                      <p className='font-medium text-gray-900 dark:text-gray-100'>{item.name}</p>
                      <p className='text-sm text-gray-500'>
                        {item.size} x {item.quantity}
                      </p>
                    </div>
                  </div>

                  <p className='font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap'>
                    {formatMoney((Number(item.price) || 0) * (Number(item.quantity) || 1))}
                  </p>
                </div>
              ))}
            </div>

            <div className='mt-6 border-t border-gray-200 pt-4 dark:border-neutral-700 text-sm space-y-2'>
              <div className='flex justify-between text-gray-600 dark:text-gray-300'>
                <span>Items:</span>
                <span>{formatMoney(itemsTotal)}</span>
              </div>
              {couponDiscountAmount > 0 ? (
                <div className='flex justify-between text-green-600 dark:text-green-400'>
                  <span>
                    Coupon{receipt.order.couponCode ? ` (${receipt.order.couponCode})` : ''}:
                  </span>
                  <span>-{formatMoney(couponDiscountAmount)}</span>
                </div>
              ) : null}
              {couponDiscountAmount > 0 ? (
                <div className='flex justify-between text-gray-600 dark:text-gray-300'>
                  <span>Food total after coupon:</span>
                  <span>{formatMoney(foodTotal)}</span>
                </div>
              ) : null}
              <div className='flex justify-between text-gray-600 dark:text-gray-300'>
                <span>Tax:</span>
                <span>{formatMoney(Number(receipt.order.taxAmount) || 0)}</span>
              </div>
              <div className='flex justify-between text-gray-600 dark:text-gray-300'>
                <span>Delivery Fee:</span>
                <span>{formatMoney(Number(receipt.order.deliveryFee) || 0)}</span>
              </div>
              <div className='flex justify-between text-base font-semibold text-gray-900 dark:text-gray-100 pt-2'>
                <span>Total:</span>
                <span>{formatMoney(Number(receipt.order.total) || 0)}</span>
              </div>
            </div>
          </div>

          {sessionId ? (
            <div className='mt-5'>
              <a
                href={`/api/my-orders/invoice?sessionId=${encodeURIComponent(sessionId)}`}
                className='inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-white font-semibold transition hover:bg-orange-700'
              >
                Download PDF invoice
              </a>
            </div>
          ) : null}
        </section>
      )}

      <div className='flex gap-4'>
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

const CheckoutPage = () => {
  return (
    <Suspense fallback={<div className='py-12 text-center text-gray-600'>Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
};

export default CheckoutPage;
