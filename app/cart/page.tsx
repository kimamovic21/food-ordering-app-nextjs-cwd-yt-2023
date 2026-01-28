'use client';

import { useEffect, useState, useRef, type ChangeEvent } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { calculateLoyaltyDiscount } from '@/libs/loyaltyCalculator';
import type { FeeBreakdown } from '@/libs/deliveryFeeCalculator';
import useProfile from '@/contexts/UseProfile';
import Link from 'next/link';
import CartItems from './CartItems';
import DeliveryInformation from './DeliveryInformation';
import OrderSummary from './OrderSummary';
import Title from '@/components/shared/Title';

const CartSkeleton = () => (
  <div className='max-w-7xl mx-auto py-4 sm:py-8 px-2 sm:px-4'>
    <div className='flex justify-between items-center mb-6 sm:mb-8'>
      <Skeleton className='h-8 sm:h-10 w-56' />
    </div>
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
      <div className='lg:col-span-2'>
        <div className='space-y-4 mb-6 sm:mb-8'>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className='bg-card border rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4'
            >
              <div className='flex items-start gap-3 w-full sm:w-auto'>
                <Skeleton className='w-16 h-16 sm:w-20 sm:h-20 rounded-md' />
                <div className='grow min-w-0 space-y-2'>
                  <Skeleton className='h-4 w-32 sm:w-40' />
                  <Skeleton className='h-3 w-20 sm:w-28' />
                  <Skeleton className='h-3 w-16 sm:w-24' />
                </div>
              </div>
              <div className='flex items-center w-full gap-3 sm:gap-4'>
                <div className='flex items-center gap-2 sm:gap-3'>
                  <Skeleton className='w-8 h-8 sm:w-8 sm:h-8 lg:w-6 lg:h-6 rounded-full' />
                  <Skeleton className='h-5 w-6' />
                  <Skeleton className='w-8 h-8 sm:w-8 sm:h-8 lg:w-6 lg:h-6 rounded-full' />
                </div>
                <div className='flex items-center gap-3 ml-auto'>
                  <Skeleton className='h-5 w-14' />
                  <Skeleton className='w-4 h-4 rounded-sm' />
                </div>
              </div>
            </div>
          ))}
        </div>
        <Skeleton className='h-10 w-full bg-red-500 rounded flex items-center justify-center gap-2' />
      </div>
      <div className='lg:col-span-1 space-y-4'>
        {/* Order Summary Skeleton */}
        <div className='bg-card border rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4'>
          <Skeleton className='h-6 w-32 mb-2' />
          <div className='space-y-2 border-b pb-3'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-4 w-24' />
          </div>
          <div className='space-y-2 border-b pb-3'>
            <Skeleton className='h-4 w-28' />
            <Skeleton className='h-4 w-28' />
            <Skeleton className='h-4 w-32' />
          </div>
          <div className='border-t pt-3'>
            <Skeleton className='h-6 w-24' />
          </div>
          <Skeleton className='h-10 w-full rounded-full mt-4' />
        </div>
        {/* Delivery Information Skeleton */}
        <div className='bg-card border rounded-xl p-4 sm:p-6 space-y-4 lg:max-h-[70vh] lg:overflow-y-auto'>
          <Skeleton className='h-6 w-40 mb-2' />
          {[...Array(5)].map((_, i) => (
            <div key={i} className='space-y-2'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-9 w-full' />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();

  const { data: profileData } = useProfile();
  const { status: sessionStatus } = useSession();
  const isLoggedIn = sessionStatus === 'authenticated';

  const [formData, setFormData] = useState({
    phone: '',
    streetAddress: '',
    postalCode: '',
    city: '',
    country: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState<FeeBreakdown | null>(null);
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [loyaltyDiscountPercentage, setLoyaltyDiscountPercentage] = useState(0);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Fetch user's loyalty discount
  useEffect(() => {
    const fetchLoyaltyDiscount = async () => {
      if (!isLoggedIn) {
        setLoyaltyDiscountPercentage(0);
        return;
      }

      try {
        const response = await fetch('/api/loyalty');
        if (response.ok) {
          const data = await response.json();
          setLoyaltyDiscountPercentage(data.discountPercentage || 0);
        }
      } catch (error) {
        console.error('Failed to fetch loyalty discount:', error);
        setLoyaltyDiscountPercentage(0);
      }
    };

    fetchLoyaltyDiscount();
  }, [isLoggedIn]);

  useEffect(() => {
    if (profileData) {
      setFormData({
        phone: profileData.phone || '',
        streetAddress: profileData.streetAddress || '',
        postalCode: profileData.postalCode || '',
        city: profileData.city || '',
        country: profileData.country || '',
      });
    }
  }, [profileData]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Calculate delivery fee when address changes
  useEffect(() => {
    const calculateFee = async () => {
      if (!formData.city || !formData.country) {
        setDeliveryFee(null);
        return;
      }

      setCalculatingFee(true);
      try {
        const defaultCoords = getApproximateCoordinates(formData.city);

        if (!defaultCoords) {
          setDeliveryFee(null);
          return;
        }

        const response = await fetch('/api/delivery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: defaultCoords.latitude,
            longitude: defaultCoords.longitude,
            baseDeliveryFee: 5,
          }),
        });

        if (response.ok) {
          const feeData = await response.json();
          setDeliveryFee(feeData);
        }
      } catch (error) {
        console.error('Failed to calculate delivery fee:', error);
        // Fallback to base fee if calculation fails
        setDeliveryFee({
          baseFee: 5,
          weatherAdjustment: 0,
          totalAdjustment: 0,
          totalFee: 5,
        });
      } finally {
        setCalculatingFee(false);
      }
    };

    const debounce = setTimeout(calculateFee, 800);
    return () => clearTimeout(debounce);
  }, [formData.city, formData.country]);

  // Approximate coordinates for common cities (for demo purposes)
  const getApproximateCoordinates = (
    city: string
  ): { latitude: number; longitude: number } | null => {
    const coordinates: Record<string, { latitude: number; longitude: number }> = {
      sarajevo: { latitude: 43.8564, longitude: 18.4131 },
      beirut: { latitude: 33.3128, longitude: 35.5454 },
      paris: { latitude: 48.8566, longitude: 2.3522 },
      london: { latitude: 51.5074, longitude: -0.1278 },
      'new york': { latitude: 40.7128, longitude: -74.006 },
      tokyo: { latitude: 35.6762, longitude: 139.6503 },
    };

    const key = city.toLowerCase();
    return coordinates[key] || null;
  };

  const isSubmittingRef = useRef(false);
  const handleCheckout = async () => {
    if (isSubmittingRef.current || isSubmitting) return;

    setIsSubmitting(true);
    isSubmittingRef.current = true;

    try {
      if (!isLoggedIn) {
        toast.error('Please sign in to proceed to checkout.');
        return;
      }
      if (cartItems.length === 0) {
        toast.error('Your cart is empty.');
        return;
      }
      const missingField = Object.entries(formData).find(([, value]) => !value);
      if (missingField) {
        toast.error('Please complete your delivery details.');
        return;
      }
      if (!profileData?.email) {
        toast.error('We could not find your email. Please re-login.');
        return;
      }
      await toast.promise(
        (async () => {
          const actualDeliveryFee = deliveryFee?.totalFee || 5;
          const loyaltyDiscount = calculateLoyaltyDiscount(
            actualDeliveryFee,
            loyaltyDiscountPercentage
          );
          const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...formData,
              cartItems,
              deliveryFee: deliveryFee?.totalFee || 5,
              deliveryFeeBreakdown: deliveryFee
                ? {
                    baseFee: deliveryFee.baseFee,
                    weatherAdjustment: deliveryFee.weatherAdjustment,
                    totalAdjustment: deliveryFee.totalAdjustment,
                  }
                : null,
              loyaltyDiscount,
              loyaltyDiscountPercentage,
            }),
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || 'Failed to start checkout.');
          }
          const data = await response.json();
          if (data?.url) {
            window.location.href = data.url;
          } else {
            throw new Error('Checkout URL missing.');
          }
        })(),
        {
          loading: 'Processing checkout...',
          success: 'Redirecting to payment...',
          error: (err) => err?.message || 'Unable to proceed to checkout.',
        }
      );
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  if (!hydrated) {
    return <CartSkeleton />;
  }

  if (cartItems.length === 0) {
    return (
      <div className='text-center py-16 min-h-screen flex flex-col items-center justify-center'>
        <h2 className='text-4xl font-bold text-foreground mb-4'>Your Cart is Empty</h2>

        <p className='text-muted-foreground mb-8'>Add some delicious items to your cart!</p>

        <Link href='/menu' className='inline-block'>
          <Button size='lg' className='rounded-full'>
            Browse Menu
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className='max-w-7xl mx-auto py-4 sm:py-8 px-2 sm:px-4 min-h-[60vh]'>
      <div className='flex justify-between items-center mb-6 sm:mb-8'>
        <Title>Shopping Cart</Title>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2'>
          <CartItems
            cartItems={cartItems}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            clearCart={clearCart}
          />
        </div>

        <div className='lg:col-span-1 space-y-4'>
          <DeliveryInformation
            email={profileData?.email || ''}
            formData={formData}
            handleInputChange={handleInputChange}
          />
          <OrderSummary
            subtotal={getTotalPrice()}
            deliveryFee={deliveryFee?.totalFee || 5}
            loyaltyDiscountPercentage={loyaltyDiscountPercentage}
            loyaltyDiscount={calculateLoyaltyDiscount(
              deliveryFee?.totalFee || 5,
              loyaltyDiscountPercentage
            )}
            weatherAdjustment={deliveryFee?.weatherAdjustment || 0}
            isLoggedIn={isLoggedIn}
            isSubmitting={isSubmitting}
            handleCheckout={handleCheckout}
            calculatingFee={calculatingFee}
          />
        </div>
      </div>
    </div>
  );
};

export default CartPage;
