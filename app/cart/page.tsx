'use client';

import { useEffect, useState, useRef, type ChangeEvent } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { calculateLoyaltyDiscount } from '@/libs/loyaltyCalculator';
import {
  calculateCouponDiscountAmount,
  getCouponValidationError,
  normalizeCouponCode,
  type CouponLike,
} from '@/libs/coupon';
import useProfile from '@/hooks/useProfile';
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
        <Skeleton className='h-10 w-full rounded' />
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
  const [restaurants, setRestaurants] = useState<Map<string, any>>(new Map());
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [loyaltyDiscountPercentage, setLoyaltyDiscountPercentage] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponLike | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHydrated(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Fetch restaurant data for cart items (single restaurant only)
  useEffect(() => {
    const fetchRestaurants = async () => {
      if (cartItems.length === 0) {
        setRestaurants(new Map());
        return;
      }

      // Get the single restaurant ID from cart items
      const restaurantId = cartItems[0]?.restaurantId;

      if (!restaurantId) {
        console.warn('No valid restaurant ID found in cart items');
        setRestaurants(new Map());
        setLoadingRestaurants(false);
        return;
      }

      setLoadingRestaurants(true);
      try {
        const restaurantData = new Map();

        try {
          const response = await fetch(`/api/restaurant/${restaurantId}`);
          if (response.ok) {
            const data = await response.json();
            restaurantData.set(restaurantId, data.restaurant);
          } else {
            console.error(`Failed to fetch restaurant ${restaurantId}: ${response.status}`);
            const errorText = await response.text();
            console.error('Error response:', errorText);
          }
        } catch (error) {
          console.error(`Failed to fetch restaurant ${restaurantId}:`, error);
        }

        setRestaurants(restaurantData);
      } catch (error) {
        console.error('Failed to fetch restaurants:', error);
      } finally {
        setLoadingRestaurants(false);
      }
    };

    fetchRestaurants();
  }, [cartItems]);

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

  useEffect(() => {
    if (!cartItems.length) {
      setCouponCode('');
      setAppliedCoupon(null);
      setCouponMessage(null);
      setCouponError(null);
      return;
    }

    const currentRestaurantId = cartItems[0]?.restaurantId || null;
    if (
      appliedCoupon &&
      appliedCoupon.restaurantId &&
      appliedCoupon.restaurantId !== currentRestaurantId
    ) {
      setCouponCode('');
      setAppliedCoupon(null);
      setCouponMessage(null);
      setCouponError(null);
    }
  }, [appliedCoupon, cartItems]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Calculate included tax amount and delivery fee from the single restaurant
  const calculateTotals = () => {
    const restaurantId = cartItems[0]?.restaurantId;

    if (!restaurantId) {
      return { includedTax: 0, taxPercentage: 0, totalDeliveryFee: 0 };
    }

    const restaurant = restaurants.get(restaurantId);
    if (!restaurant) {
      return { includedTax: 0, taxPercentage: 0, totalDeliveryFee: 0 };
    }

    const subtotal = getTotalPrice();
    const includedTax = subtotal * (restaurant.tax / 100);
    const totalDeliveryFee = restaurant.courierFee || 5;

    return { includedTax, taxPercentage: restaurant.tax, totalDeliveryFee };
  };

  // Check if cart has items from multiple restaurants
  const hasMultipleRestaurants = () => {
    if (cartItems.length === 0) return false;
    const restaurantIds = new Set(cartItems.map((item) => item.restaurantId));
    return restaurantIds.size > 1;
  };

  // Get the restaurant ID from cart
  const getCartRestaurantId = () => {
    return cartItems.length > 0 ? cartItems[0]?.restaurantId : null;
  };

  // Get the restaurant data from cart
  const getCartRestaurant = () => {
    const restaurantId = getCartRestaurantId();
    if (!restaurantId) return null;
    return restaurants.get(restaurantId);
  };

  // Check if the single restaurant is open
  const isRestaurantOpen = () => {
    const restaurant = getCartRestaurant();

    if (!restaurant || !restaurant.isOpen) {
      return false;
    }
    return true;
  };

  // Get the restaurant name from cart
  const getRestaurantName = () => {
    const restaurant = getCartRestaurant();
    return restaurant?.name || 'The restaurant';
  };

  const subtotal = getTotalPrice();
  const couponValidationError = appliedCoupon
    ? getCouponValidationError({ coupon: appliedCoupon, subtotal })
    : null;
  const couponDiscount =
    appliedCoupon && !couponValidationError
      ? calculateCouponDiscountAmount(subtotal, appliedCoupon)
      : 0;
  const loyaltyDiscountBase = Math.max(0, subtotal - couponDiscount);
  const loyaltyDiscount = calculateLoyaltyDiscount(loyaltyDiscountBase, loyaltyDiscountPercentage);

  const handleCouponCodeChange = (value: string) => {
    const normalized = normalizeCouponCode(value);
    setCouponCode(normalized);
    if (couponError) {
      setCouponError(null);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Enter a coupon code first.');
      setCouponMessage(null);
      return;
    }

    const restaurantId = getCartRestaurantId();
    if (!restaurantId) {
      setCouponError('Add items from a restaurant before applying a coupon.');
      setCouponMessage(null);
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const response = await fetch(
        `/api/coupons?code=${encodeURIComponent(couponCode)}&restaurantId=${encodeURIComponent(
          restaurantId
        )}&subtotal=${encodeURIComponent(String(subtotal))}`
      );
      const json = await response.json().catch(() => null);

      if (!response.ok || !json?.valid) {
        const message = json?.error || 'Coupon for this restaurant not available';
        setAppliedCoupon(null);
        setCouponMessage(null);
        setCouponError(message);
        toast.error(message, {
          style: { background: '#ef4444', color: 'white' },
        });
        return;
      }

      setAppliedCoupon(json.coupon);
      setCouponCode(json.coupon.code || couponCode);
      setCouponError(null);
      setCouponMessage(json.message || 'Coupon applied successfully.');
      toast.success('Coupon applied!', {
        style: { background: '#22c55e', color: 'white' },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Coupon for this restaurant not available';
      setAppliedCoupon(null);
      setCouponMessage(null);
      setCouponError(message);
      toast.error(message, {
        style: { background: '#ef4444', color: 'white' },
      });
    } finally {
      setIsApplyingCoupon(false);
    }
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

      // Check if cart has items from multiple restaurants
      if (hasMultipleRestaurants()) {
        toast.error('You must have items only from one restaurant.');
        return;
      }

      // Check if the restaurant is open
      if (!isRestaurantOpen()) {
        const restaurantName = getRestaurantName();
        toast.error(
          `${restaurantName} you want to order from is not working at the moment. Please remove items and try ordering from another restaurant.`
        );
        return;
      }

      const missingField = Object.entries(formData).find(([, value]) => !value);
      if (missingField) {
        toast.error('Please complete your delivery details.', {
          style: {
            background: '#ef4444', // Tailwind red-500
            color: 'white',
          },
          duration: 4000,
        });
        return;
      }
      if (!profileData?.email) {
        toast.error('We could not find your email. Please re-login.');
        return;
      }

      const { totalDeliveryFee } = calculateTotals();
      const couponToSend = couponValidationError ? '' : appliedCoupon?.code || '';

      await toast.promise(
        (async () => {
          const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...formData,
              cartItems,
              loyaltyDiscount,
              loyaltyDiscountPercentage,
              couponCode: couponToSend,
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

  const { includedTax, taxPercentage, totalDeliveryFee } = calculateTotals();
  const multipleRestaurants = hasMultipleRestaurants();
  const restaurantOpen = isRestaurantOpen();
  const restaurantName = getRestaurantName();
  const displayedCouponMessage = couponValidationError || couponMessage;

  return (
    <div className='max-w-7xl mx-auto py-4 sm:py-8 px-2 sm:px-4 min-h-[60vh]'>
      <div className='flex justify-between items-center mb-6 sm:mb-8'>
        <Title>Shopping Cart</Title>
      </div>

      {multipleRestaurants && (
        <div className='mb-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg'>
          <p className='text-red-800 dark:text-red-200 font-semibold'>
            ⚠️ You must have items only from one restaurant. Please remove items from other
            restaurants to continue.
          </p>
        </div>
      )}

      {!multipleRestaurants && !restaurantOpen && (
        <div className='mb-4 p-4 bg-orange-100 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700 rounded-lg'>
          <p className='text-orange-800 dark:text-orange-200 font-semibold'>
            {restaurantName} you want to order from is not working at the moment. Please remove
            items from this restaurant and try ordering from another restaurant.
          </p>
        </div>
      )}

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
            subtotal={subtotal}
            includedTax={includedTax}
            taxPercentage={taxPercentage}
            deliveryFee={totalDeliveryFee}
            loyaltyDiscountPercentage={loyaltyDiscountPercentage}
            loyaltyDiscount={loyaltyDiscount}
            couponCode={couponCode}
            couponDiscount={couponDiscount}
            couponMessage={displayedCouponMessage}
            couponError={couponValidationError || couponError}
            isApplyingCoupon={isApplyingCoupon}
            onCouponCodeChange={handleCouponCodeChange}
            onApplyCoupon={handleApplyCoupon}
            isLoggedIn={isLoggedIn}
            isSubmitting={isSubmitting}
            handleCheckout={handleCheckout}
            restaurantsOpen={restaurantOpen && !multipleRestaurants}
            loadingRestaurants={loadingRestaurants}
          />
        </div>
      </div>
    </div>
  );
};

export default CartPage;
