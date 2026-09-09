'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AlertTriangle, CheckCircle2, Clock3, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
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
import useDeliveryAddresses from '@/hooks/useDeliveryAddresses';
import Link from 'next/link';
import CartItems from './CartItems';
import DeliveryInformation from './DeliveryInformation';
import OrderSummary from './OrderSummary';
import Title from '@/components/shared/Title';
import RestaurantAvailabilityNotifyButton from '@/components/shared/RestaurantAvailabilityNotifyButton';
import type { CartValidationItem, CartValidationResponse, CheckoutStartResult } from '@/types/cart';
import type { DeliveryAddressInput } from '@/types/user';

const RESTAURANT_STATUS_CHECK_MIN_MS = 1000;
const RESTAURANT_STATUS_DOT_STEPS = ['.', '..', '...'] as const;

const getCartItemKey = (item: { _id: string; size: string }) => `${item._id}:${item.size}`;

type CartAvailabilityBannerTone = 'checking' | 'success' | 'danger' | 'warning';

const cartAvailabilityBannerStyles: Record<
  CartAvailabilityBannerTone,
  {
    wrapper: string;
    icon: string;
  }
> = {
  checking: {
    wrapper: 'border-primary/30 bg-primary/10 text-primary',
    icon: 'text-primary',
  },
  success: {
    wrapper:
      'border-green-300 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200',
    icon: 'text-green-600 dark:text-green-300',
  },
  danger: {
    wrapper:
      'border-red-300 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200',
    icon: 'text-red-600 dark:text-red-300',
  },
  warning: {
    wrapper:
      'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200',
    icon: 'text-amber-600 dark:text-amber-300',
  },
};

type CartAvailabilityBannerProps = {
  tone: CartAvailabilityBannerTone;
  icon: ReactNode;
  title: string;
  message: string;
  children?: ReactNode;
};

const CartAvailabilityBanner = ({
  tone,
  icon,
  title,
  message,
  children,
}: CartAvailabilityBannerProps) => {
  const styles = cartAvailabilityBannerStyles[tone];

  return (
    <div className={`mb-4 rounded-lg border p-4 ${styles.wrapper}`}>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='flex gap-3'>
          <div className={`mt-0.5 shrink-0 ${styles.icon}`}>{icon}</div>
          <div>
            <p className='font-semibold'>{title}</p>
            <p className='mt-1 text-sm opacity-90'>{message}</p>
          </div>
        </div>
        {children ? <div className='sm:shrink-0'>{children}</div> : null}
      </div>
    </div>
  );
};

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
          {[...Array(6)].map((_, i) => (
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
  const router = useRouter();
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();

  const { data: profileData } = useProfile();
  const { status: sessionStatus } = useSession();
  const isLoggedIn = sessionStatus === 'authenticated';
  const {
    addresses: savedDeliveryAddresses,
    isLoading: loadingSavedDeliveryAddresses,
    createAddress: createDeliveryAddress,
    setDefaultAddress,
    deleteAddress,
  } = useDeliveryAddresses(isLoggedIn);

  const [formData, setFormData] = useState({
    phone: '',
    streetAddress: '',
    postalCode: '',
    city: '',
    country: '',
    deliveryLatitude: null as number | null,
    deliveryLongitude: null as number | null,
    specialInstructions: '',
  });
  const [isGettingDeliveryLocation, setIsGettingDeliveryLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [restaurants, setRestaurants] = useState<Map<string, any>>(new Map());
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [restaurantStatusReady, setRestaurantStatusReady] = useState(false);
  const [restaurantLookupFailed, setRestaurantLookupFailed] = useState(false);
  const [restaurantStatusDotsIndex, setRestaurantStatusDotsIndex] = useState(0);
  const [loyaltyDiscountPercentage, setLoyaltyDiscountPercentage] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponLike | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [bestCoupon, setBestCoupon] = useState<{
    coupon: CouponLike;
    discountAmount: number;
    message: string | null;
  } | null>(null);
  const [isLoadingBestCoupon, setIsLoadingBestCoupon] = useState(false);
  const [cartValidationItems, setCartValidationItems] = useState<CartValidationItem[]>([]);
  const [cartValidationMessage, setCartValidationMessage] = useState<string | null>(null);
  const [loadingMenuAvailability, setLoadingMenuAvailability] = useState(false);
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState('');
  const hasLoadedProfileDeliveryInfoRef = useRef(false);
  const hasAppliedDefaultDeliveryAddressRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHydrated(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const cartRestaurantIdForLookup = useMemo(
    () => (cartItems.length > 0 ? cartItems[0]?.restaurantId || null : null),
    [cartItems]
  );

  // Fetch restaurant data for cart items (single restaurant only)
  useEffect(() => {
    let cancelled = false;
    let checkTimer: ReturnType<typeof setTimeout> | null = null;

    const completeRestaurantStatusCheck = (startedAt: number) => {
      const remainingDelay = Math.max(0, RESTAURANT_STATUS_CHECK_MIN_MS - (Date.now() - startedAt));

      checkTimer = setTimeout(() => {
        if (cancelled) {
          return;
        }

        setLoadingRestaurants(false);
        setRestaurantStatusReady(true);
      }, remainingDelay);
    };

    const fetchRestaurants = async () => {
      if (!cartRestaurantIdForLookup) {
        setRestaurants(new Map());
        setLoadingRestaurants(false);
        setRestaurantStatusReady(false);
        setRestaurantLookupFailed(false);
        return;
      }

      const startedAt = Date.now();
      setLoadingRestaurants(true);
      setRestaurantStatusReady(false);
      setRestaurantLookupFailed(false);

      try {
        const restaurantData = new Map();

        try {
          const response = await fetch(`/api/restaurant/${cartRestaurantIdForLookup}`);
          if (response.ok) {
            const data = await response.json();
            if (data?.restaurant) {
              restaurantData.set(cartRestaurantIdForLookup, data.restaurant);
            } else if (!cancelled) {
              setRestaurantLookupFailed(true);
            }
          } else {
            console.error(
              `Failed to fetch restaurant ${cartRestaurantIdForLookup}: ${response.status}`
            );
            const errorText = await response.text();
            console.error('Error response:', errorText);
            if (!cancelled) {
              setRestaurantLookupFailed(true);
            }
          }
        } catch (error) {
          console.error(`Failed to fetch restaurant ${cartRestaurantIdForLookup}:`, error);
          if (!cancelled) {
            setRestaurantLookupFailed(true);
          }
        }

        if (!cancelled) {
          setRestaurants(restaurantData);
        }
      } catch (error) {
        console.error('Failed to fetch restaurants:', error);
        if (!cancelled) {
          setRestaurantLookupFailed(true);
          setRestaurants(new Map());
        }
      } finally {
        completeRestaurantStatusCheck(startedAt);
      }
    };

    fetchRestaurants();

    return () => {
      cancelled = true;
      if (checkTimer) {
        clearTimeout(checkTimer);
      }
    };
  }, [cartRestaurantIdForLookup]);

  useEffect(() => {
    if (!cartRestaurantIdForLookup || restaurantStatusReady) {
      setRestaurantStatusDotsIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setRestaurantStatusDotsIndex((currentIndex) =>
        currentIndex === RESTAURANT_STATUS_DOT_STEPS.length - 1 ? 0 : currentIndex + 1
      );
    }, 350);

    return () => clearInterval(interval);
  }, [cartRestaurantIdForLookup, restaurantStatusReady]);

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
    if (!profileData || hasLoadedProfileDeliveryInfoRef.current) {
      return;
    }

    hasLoadedProfileDeliveryInfoRef.current = true;
    setFormData((prev) => ({
      ...prev,
      phone: prev.phone || profileData.phone || '',
      streetAddress: prev.streetAddress || profileData.streetAddress || '',
      postalCode: prev.postalCode || profileData.postalCode || '',
      city: prev.city || profileData.city || '',
      country: prev.country || profileData.country || '',
    }));
  }, [profileData]);

  useEffect(() => {
    if (
      hasAppliedDefaultDeliveryAddressRef.current ||
      savedDeliveryAddresses.length === 0 ||
      formData.deliveryLatitude !== null ||
      formData.deliveryLongitude !== null
    ) {
      return;
    }

    const defaultAddress = savedDeliveryAddresses.find((address) => address.isDefault);
    if (!defaultAddress) {
      return;
    }

    hasAppliedDefaultDeliveryAddressRef.current = true;
    setSelectedDeliveryAddressId(defaultAddress._id);
    setFormData((prev) => ({
      ...prev,
      phone: defaultAddress.phone,
      streetAddress: defaultAddress.streetAddress,
      postalCode: defaultAddress.postalCode,
      city: defaultAddress.city,
      country: defaultAddress.country,
      deliveryLatitude: defaultAddress.deliveryLatitude,
      deliveryLongitude: defaultAddress.deliveryLongitude,
    }));
  }, [formData.deliveryLatitude, formData.deliveryLongitude, savedDeliveryAddresses]);

  const fetchCartValidation = useCallback(async (): Promise<CartValidationResponse> => {
    const response = await fetch('/api/cart/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cartItems,
        deliveryLatitude: formData.deliveryLatitude,
        deliveryLongitude: formData.deliveryLongitude,
      }),
    });
    const json = (await response.json().catch(() => null)) as CartValidationResponse | null;

    if (!response.ok || !json) {
      throw new Error('Failed to validate cart items.');
    }

    return json;
  }, [cartItems, formData.deliveryLatitude, formData.deliveryLongitude]);

  useEffect(() => {
    if (cartItems.length === 0) {
      setCartValidationItems([]);
      setCartValidationMessage(null);
      setLoadingMenuAvailability(false);
      return;
    }

    let cancelled = false;

    const validateCart = async () => {
      setLoadingMenuAvailability(true);

      try {
        const validation = await fetchCartValidation();

        if (!cancelled) {
          setCartValidationItems(validation.items);
          setCartValidationMessage(validation.message || null);
        }
      } catch (error) {
        console.error('Failed to validate cart:', error);
        if (!cancelled) {
          setCartValidationItems(
            cartItems.map((item) => ({
              _id: item._id,
              itemKey: getCartItemKey(item),
              status: 'invalid',
              message: 'We could not validate this cart item. Please try again.',
            }))
          );
          setCartValidationMessage(
            'We could not validate your cart. Please refresh and try again.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingMenuAvailability(false);
        }
      }
    };

    validateCart();

    return () => {
      cancelled = true;
    };
  }, [cartItems, fetchCartValidation]);

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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const cartValidationByKey = useMemo(
    () => new Map(cartValidationItems.map((item) => [item.itemKey, item])),
    [cartValidationItems]
  );
  const blockingCartItems = useMemo(
    () =>
      cartItems.filter((item) => {
        const validation = cartValidationByKey.get(getCartItemKey(item));
        return validation ? validation.status !== 'valid' : false;
      }),
    [cartItems, cartValidationByKey]
  );
  const priceChangedCartItems = useMemo(
    () =>
      cartItems.filter((item) => {
        const validation = cartValidationByKey.get(getCartItemKey(item));
        return Boolean(validation?.status === 'valid' && validation.priceChanged);
      }),
    [cartItems, cartValidationByKey]
  );
  const getValidatedItemPrice = (item: (typeof cartItems)[number]) => {
    const validation = cartValidationByKey.get(getCartItemKey(item));

    if (
      validation?.status === 'valid' &&
      typeof validation.price === 'number' &&
      Number.isFinite(validation.price)
    ) {
      return validation.price;
    }

    return typeof item.price === 'number' && Number.isFinite(item.price) ? item.price : 0;
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

    return Boolean(restaurant?.isOpen);
  };

  // Get the restaurant name from cart
  const getRestaurantName = () => {
    const restaurant = getCartRestaurant();
    return restaurant?.name || 'The restaurant';
  };

  const isRestaurantBusy = () => {
    const restaurant = getCartRestaurant();
    return Boolean(restaurant?.isBusy);
  };

  const getMinimumOrderAmount = () => {
    const restaurant = getCartRestaurant();
    return Math.min(100, Math.max(1, Number(restaurant?.minimumOrderAmount) || 10));
  };

  const isRestaurantPaused = () => {
    const restaurant = getCartRestaurant();
    return Boolean(restaurant?.isPaused);
  };

  const isRestaurantAcceptingCheckout = () => {
    const restaurant = getCartRestaurant();
    return restaurant ? restaurant.isAcceptingOrders !== false : false;
  };

  const getRestaurantUnavailableReason = () => {
    const restaurant = getCartRestaurant();
    return restaurant?.orderingUnavailableReason || null;
  };

  const getDeliveryRadiusKm = () => {
    const restaurant = getCartRestaurant();
    return typeof restaurant?.deliveryRadiusKm === 'number' ? restaurant.deliveryRadiusKm : null;
  };

  const getDeliveryDistanceKm = () => {
    const restaurant = getCartRestaurant();
    if (
      typeof restaurant?.latitude !== 'number' ||
      typeof restaurant?.longitude !== 'number' ||
      typeof formData.deliveryLatitude !== 'number' ||
      typeof formData.deliveryLongitude !== 'number'
    ) {
      return null;
    }

    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const latDelta = toRadians(formData.deliveryLatitude - restaurant.latitude);
    const lonDelta = toRadians(formData.deliveryLongitude - restaurant.longitude);
    const originLat = toRadians(restaurant.latitude);
    const destinationLat = toRadians(formData.deliveryLatitude);
    const haversine =
      Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
      Math.sin(lonDelta / 2) *
        Math.sin(lonDelta / 2) *
        Math.cos(originLat) *
        Math.cos(destinationLat);

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  };

  const hasDeliveryLocation =
    typeof formData.deliveryLatitude === 'number' && typeof formData.deliveryLongitude === 'number';

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      sonnerToast.error('Your browser does not support location checks.');
      return;
    }

    setIsGettingDeliveryLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          deliveryLatitude: position.coords.latitude,
          deliveryLongitude: position.coords.longitude,
        }));
        setIsGettingDeliveryLocation(false);
        sonnerToast.success('Delivery location confirmed');
      },
      () => {
        setIsGettingDeliveryLocation(false);
        sonnerToast.error('Unable to access your location. Please allow location access.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleManualDeliveryLocationUpdate = (latitude: number, longitude: number) => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      deliveryLatitude: latitude,
      deliveryLongitude: longitude,
    }));
  };

  const hasRequiredDeliveryAddressFields = [
    formData.phone,
    formData.streetAddress,
    formData.postalCode,
    formData.city,
    formData.country,
  ].every((value) => String(value || '').trim());
  const canSaveDeliveryAddress =
    isLoggedIn && hasRequiredDeliveryAddressFields && hasDeliveryLocation;

  const handleSelectSavedAddress = (addressId: string) => {
    const selectedAddress = savedDeliveryAddresses.find((address) => address._id === addressId);
    if (!selectedAddress) {
      return;
    }

    setSelectedDeliveryAddressId(addressId);
    setFormData((prev) => ({
      ...prev,
      phone: selectedAddress.phone,
      streetAddress: selectedAddress.streetAddress,
      postalCode: selectedAddress.postalCode,
      city: selectedAddress.city,
      country: selectedAddress.country,
      deliveryLatitude: selectedAddress.deliveryLatitude,
      deliveryLongitude: selectedAddress.deliveryLongitude,
    }));
    sonnerToast.success('Delivery address applied', {
      style: { background: '#22c55e', color: 'white' },
    });
  };

  const handleSaveCurrentDeliveryAddress = async () => {
    if (!canSaveDeliveryAddress) {
      sonnerToast.error('Complete delivery details and confirm your location first.');
      return;
    }

    const label = `${formData.streetAddress}, ${formData.city}`.slice(0, 60);
    const address: DeliveryAddressInput = {
      label,
      phone: formData.phone,
      streetAddress: formData.streetAddress,
      postalCode: formData.postalCode,
      city: formData.city,
      country: formData.country,
      deliveryLatitude: formData.deliveryLatitude as number,
      deliveryLongitude: formData.deliveryLongitude as number,
      isDefault: savedDeliveryAddresses.length === 0,
    };

    try {
      const result = await createDeliveryAddress.mutateAsync(address);
      if (result.address?._id) {
        setSelectedDeliveryAddressId(result.address._id);
      }

      if (result.duplicate) {
        sonnerToast.info('This delivery address is already saved. Using the saved address.');
        return;
      }

      sonnerToast.success(
        savedDeliveryAddresses.length === 0
          ? 'Delivery address saved as your default.'
          : 'Delivery address saved.',
        {
          style: { background: '#22c55e', color: 'white' },
        }
      );
    } catch (error) {
      sonnerToast.error(error instanceof Error ? error.message : 'Failed to save address.');
    }
  };

  const handleSetDefaultDeliveryAddress = async () => {
    if (!selectedDeliveryAddressId) {
      return;
    }

    try {
      await setDefaultAddress.mutateAsync(selectedDeliveryAddressId);
      sonnerToast.success('Default delivery address updated', {
        style: { background: '#22c55e', color: 'white' },
      });
    } catch (error) {
      sonnerToast.error(error instanceof Error ? error.message : 'Failed to update address.');
    }
  };

  const handleDeleteSelectedDeliveryAddress = async () => {
    if (!selectedDeliveryAddressId) {
      return;
    }

    try {
      await deleteAddress.mutateAsync(selectedDeliveryAddressId);
      setSelectedDeliveryAddressId('');
      sonnerToast.success('Delivery address deleted', {
        style: { background: '#22c55e', color: 'white' },
      });
    } catch (error) {
      sonnerToast.error(error instanceof Error ? error.message : 'Failed to delete address.');
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + getValidatedItemPrice(item) * item.quantity,
    0
  );
  const couponValidationError = appliedCoupon
    ? getCouponValidationError({ coupon: appliedCoupon, subtotal })
    : null;
  const couponDiscount =
    appliedCoupon && !couponValidationError
      ? calculateCouponDiscountAmount(subtotal, appliedCoupon)
      : 0;
  const loyaltyDiscountBase = Math.max(0, subtotal - couponDiscount);
  const loyaltyDiscount = calculateLoyaltyDiscount(loyaltyDiscountBase, loyaltyDiscountPercentage);

  useEffect(() => {
    const restaurantId = cartItems.length > 0 ? cartItems[0]?.restaurantId : null;

    if (!restaurantId || subtotal <= 0) {
      setBestCoupon(null);
      setIsLoadingBestCoupon(false);
      return;
    }

    let cancelled = false;

    const fetchBestCoupon = async () => {
      setIsLoadingBestCoupon(true);

      try {
        const response = await fetch(
          `/api/coupons?best=true&restaurantId=${encodeURIComponent(
            restaurantId
          )}&subtotal=${encodeURIComponent(String(subtotal))}`
        );
        const json = await response.json().catch(() => null);

        if (!cancelled) {
          setBestCoupon(
            response.ok && json?.coupon
              ? {
                  coupon: json.coupon,
                  discountAmount: Number(json.discountAmount) || 0,
                  message: json.message || null,
                }
              : null
          );
        }
      } catch (error) {
        console.error('Failed to fetch best coupon:', error);
        if (!cancelled) {
          setBestCoupon(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingBestCoupon(false);
        }
      }
    };

    fetchBestCoupon();

    return () => {
      cancelled = true;
    };
  }, [cartItems, subtotal]);

  const handleCouponCodeChange = (value: string) => {
    const normalized = normalizeCouponCode(value);
    setCouponCode(normalized);
    if (couponError) {
      setCouponError(null);
    }
  };

  const handleApplyBestCoupon = () => {
    if (!bestCoupon?.coupon) {
      return;
    }

    setAppliedCoupon(bestCoupon.coupon);
    setCouponCode(bestCoupon.coupon.code);
    setCouponError(null);
    setCouponMessage(
      bestCoupon.message ||
        `Coupon applied successfully. You saved $${bestCoupon.discountAmount.toFixed(2)}.`
    );
    sonnerToast.success('Best coupon applied!', {
      style: { background: '#22c55e', color: 'white' },
    });
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
        sonnerToast.error(message, {
          style: { background: '#ef4444', color: 'white' },
        });
        return;
      }

      setAppliedCoupon(json.coupon);
      setCouponCode(json.coupon.code || couponCode);
      setCouponError(null);
      setCouponMessage(json.message || 'Coupon applied successfully.');
      sonnerToast.success('Coupon applied!', {
        style: { background: '#22c55e', color: 'white' },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Coupon for this restaurant not available';
      setAppliedCoupon(null);
      setCouponMessage(null);
      setCouponError(message);
      sonnerToast.error(message, {
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
        sonnerToast.error('Please sign in to proceed to checkout.');
        return;
      }
      if (cartItems.length === 0) {
        sonnerToast.error('Your cart is empty.');
        return;
      }

      if (loadingMenuAvailability) {
        sonnerToast.error('Please wait while we check menu availability.');
        return;
      }

      const latestCartValidation = await fetchCartValidation();
      setCartValidationItems(latestCartValidation.items);
      setCartValidationMessage(latestCartValidation.message || null);

      if (!latestCartValidation.canCheckout) {
        sonnerToast.error(
          latestCartValidation.message || 'Remove unavailable items before checkout.',
          {
            style: {
              background: '#ef4444',
              color: 'white',
            },
          }
        );
        return;
      }

      if (blockingCartItems.length > 0) {
        sonnerToast.error('Remove unavailable items before checkout.', {
          style: {
            background: '#ef4444',
            color: 'white',
          },
        });
        return;
      }

      // Check if cart has items from multiple restaurants
      if (hasMultipleRestaurants()) {
        sonnerToast.error('You must have items only from one restaurant.');
        return;
      }

      if (
        getCartRestaurantId() &&
        (loadingRestaurants || !restaurantStatusReady || restaurantLookupFailed)
      ) {
        sonnerToast.error(
          restaurantLookupFailed
            ? 'We could not confirm restaurant status. Please refresh and try again.'
            : 'Please wait while we check restaurant status.'
        );
        return;
      }

      // Check if the restaurant is open
      if (!isRestaurantOpen()) {
        const restaurantName = getRestaurantName();
        sonnerToast.error(
          getRestaurantUnavailableReason() ||
            `${restaurantName} you want to order from is not working at the moment. Please remove items and try ordering from another restaurant.`
        );
        return;
      }

      if (isRestaurantPaused()) {
        sonnerToast.error(
          getRestaurantUnavailableReason() ||
            `${getRestaurantName()} paused new orders for a little while. Please try again soon.`
        );
        return;
      }

      if (!isRestaurantAcceptingCheckout()) {
        sonnerToast.error(
          getRestaurantUnavailableReason() ||
            `${getRestaurantName()} is closing soon and is no longer accepting checkout.`
        );
        return;
      }

      if (isRestaurantBusy()) {
        sonnerToast.error(
          `${getRestaurantName()} is very busy at the moment. Please wait a little bit and try again.`
        );
        return;
      }

      const minimumOrderAmount = getMinimumOrderAmount();
      if (subtotal < minimumOrderAmount) {
        sonnerToast.error(
          `${getRestaurantName()} requires a minimum food subtotal of $${minimumOrderAmount.toFixed(
            2
          )}.`
        );
        return;
      }

      if (!hasDeliveryLocation) {
        sonnerToast.error('Please use your current location before checkout.');
        return;
      }

      const deliveryRadiusKm = getDeliveryRadiusKm();
      const deliveryDistanceKm = getDeliveryDistanceKm();
      if (
        typeof deliveryRadiusKm === 'number' &&
        typeof deliveryDistanceKm === 'number' &&
        deliveryDistanceKm > deliveryRadiusKm
      ) {
        sonnerToast.error(
          `${getRestaurantName()} delivers within ${deliveryRadiusKm} km. Your selected address is about ${deliveryDistanceKm.toFixed(
            1
          )} km away.`
        );
        return;
      }

      const missingField = Object.entries(formData).find(
        ([key, value]) =>
          key !== 'deliveryLatitude' &&
          key !== 'deliveryLongitude' &&
          key !== 'specialInstructions' &&
          !String(value || '').trim()
      );
      if (missingField) {
        sonnerToast.error('Please complete your delivery details.', {
          style: {
            background: '#ef4444', // Tailwind red-500
            color: 'white',
          },
          duration: 4000,
        });
        return;
      }
      if (!profileData?.email) {
        sonnerToast.error('We could not find your email. Please re-login.');
        return;
      }

      const couponToSend = couponValidationError ? '' : appliedCoupon?.code || '';

      await sonnerToast.promise(
        (async (): Promise<CheckoutStartResult> => {
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
          if (data?.paid) {
            clearCart();
            router.push(data.orderId ? `/my-orders/${data.orderId}` : '/my-orders');
            return { paid: true };
          }

          if (data?.url) {
            window.location.href = data.url;
            return { paid: false };
          } else {
            throw new Error('Checkout URL missing.');
          }
        })(),
        {
          loading: 'Processing checkout...',
          success: (result) =>
            (result as CheckoutStartResult | undefined)?.paid
              ? 'Payment already completed.'
              : 'Redirecting to payment...',
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
  const restaurantPaused = isRestaurantPaused();
  const restaurantAcceptingCheckout = isRestaurantAcceptingCheckout();
  const restaurantBusy = isRestaurantBusy();
  const restaurantName = getRestaurantName();
  const cartRestaurantId = getCartRestaurantId();
  const restaurantStatusDots = RESTAURANT_STATUS_DOT_STEPS[restaurantStatusDotsIndex];
  const checkingRestaurantStatus =
    !multipleRestaurants &&
    Boolean(cartRestaurantId) &&
    (loadingRestaurants || !restaurantStatusReady);
  const showRestaurantStatus =
    !multipleRestaurants &&
    Boolean(cartRestaurantId) &&
    restaurantStatusReady &&
    !loadingRestaurants;
  const minimumOrderAmount = getMinimumOrderAmount();
  const belowMinimumOrderAmount =
    !multipleRestaurants &&
    restaurantOpen &&
    restaurantAcceptingCheckout &&
    !restaurantPaused &&
    !restaurantBusy
      ? subtotal < minimumOrderAmount
      : false;
  const deliveryRadiusKm = getDeliveryRadiusKm();
  const deliveryDistanceKm = getDeliveryDistanceKm();
  const missingDeliveryLocation =
    !multipleRestaurants &&
    restaurantOpen &&
    restaurantAcceptingCheckout &&
    !restaurantPaused &&
    !restaurantBusy &&
    !hasDeliveryLocation;
  const outsideDeliveryRadius =
    !multipleRestaurants &&
    restaurantOpen &&
    restaurantAcceptingCheckout &&
    !restaurantPaused &&
    !restaurantBusy &&
    hasDeliveryLocation &&
    typeof deliveryRadiusKm === 'number' &&
    typeof deliveryDistanceKm === 'number' &&
    deliveryDistanceKm > deliveryRadiusKm;
  const displayedCouponMessage = couponValidationError || couponMessage;
  const handleRemoveBlockingCartItems = () => {
    blockingCartItems.forEach((item) => removeFromCart(item._id, item.size));
    sonnerToast.success('Unavailable items removed from cart', {
      style: { background: '#22c55e', color: 'white' },
    });
  };

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

      {checkingRestaurantStatus && (
        <CartAvailabilityBanner
          tone='checking'
          icon={<Loader2 className='size-5 animate-spin' aria-hidden='true' />}
          title='Checking restaurant status'
          message={`Checking if ${restaurantName} is working right now${restaurantStatusDots}`}
        />
      )}

      {showRestaurantStatus && restaurantLookupFailed && (
        <CartAvailabilityBanner
          tone='danger'
          icon={<AlertTriangle className='size-5' aria-hidden='true' />}
          title='Restaurant status unavailable'
          message='We could not confirm if this restaurant is accepting orders right now. Please refresh and try again.'
        />
      )}

      {showRestaurantStatus && !restaurantLookupFailed && !restaurantOpen && (
        <CartAvailabilityBanner
          tone='danger'
          icon={<XCircle className='size-5' aria-hidden='true' />}
          title={`${restaurantName} is closed`}
          message={
            getRestaurantUnavailableReason() ||
            `${restaurantName} is not working at the moment. Please try again during open hours or order from another restaurant.`
          }
        >
          {cartRestaurantId ? (
            <RestaurantAvailabilityNotifyButton
              restaurantId={cartRestaurantId}
              restaurantName={restaurantName}
              className='border-red-400 bg-background text-foreground hover:bg-background/90'
            />
          ) : null}
        </CartAvailabilityBanner>
      )}

      {showRestaurantStatus && !restaurantLookupFailed && restaurantOpen && restaurantPaused && (
        <CartAvailabilityBanner
          tone='warning'
          icon={<Clock3 className='size-5' aria-hidden='true' />}
          title={`${restaurantName} paused new orders`}
          message={
            getRestaurantUnavailableReason() ||
            `${restaurantName} paused new orders for a little while. Please try again soon.`
          }
        >
          {cartRestaurantId ? (
            <RestaurantAvailabilityNotifyButton
              restaurantId={cartRestaurantId}
              restaurantName={restaurantName}
              className='border-orange-400 bg-background text-foreground hover:bg-background/90'
            />
          ) : null}
        </CartAvailabilityBanner>
      )}

      {showRestaurantStatus &&
        !restaurantLookupFailed &&
        restaurantOpen &&
        !restaurantPaused &&
        !restaurantAcceptingCheckout && (
          <CartAvailabilityBanner
            tone='warning'
            icon={<Clock3 className='size-5' aria-hidden='true' />}
            title={`${restaurantName} is closing soon`}
            message={
              getRestaurantUnavailableReason() ||
              `${restaurantName} is closing soon and is no longer accepting checkout.`
            }
          >
            {cartRestaurantId ? (
              <RestaurantAvailabilityNotifyButton
                restaurantId={cartRestaurantId}
                restaurantName={restaurantName}
                className='border-amber-400 bg-background text-foreground hover:bg-background/90'
              />
            ) : null}
          </CartAvailabilityBanner>
        )}

      {showRestaurantStatus &&
        !restaurantLookupFailed &&
        restaurantOpen &&
        restaurantAcceptingCheckout &&
        !restaurantPaused &&
        restaurantBusy && (
          <CartAvailabilityBanner
            tone='warning'
            icon={<Clock3 className='size-5' aria-hidden='true' />}
            title={`${restaurantName} is busy`}
            message={`${restaurantName} is very busy at the moment. Please wait a little bit and try again.`}
          >
            {cartRestaurantId ? (
              <RestaurantAvailabilityNotifyButton
                restaurantId={cartRestaurantId}
                restaurantName={restaurantName}
                className='border-amber-400 bg-background text-foreground hover:bg-background/90'
              />
            ) : null}
          </CartAvailabilityBanner>
        )}

      {showRestaurantStatus &&
        !restaurantLookupFailed &&
        restaurantOpen &&
        restaurantAcceptingCheckout &&
        !restaurantPaused &&
        !restaurantBusy && (
          <CartAvailabilityBanner
            tone='success'
            icon={<CheckCircle2 className='size-5' aria-hidden='true' />}
            title={`${restaurantName} is accepting orders`}
            message='Restaurant is open right now. You can continue checkout once your cart and delivery details are ready.'
          />
        )}

      {belowMinimumOrderAmount && (
        <div className='mb-4 rounded-lg border border-amber-300 bg-amber-100 p-4 dark:border-amber-700 dark:bg-amber-900/20'>
          <p className='font-semibold text-amber-800 dark:text-amber-200'>
            {restaurantName} requires a minimum food subtotal of ${minimumOrderAmount.toFixed(2)} to
            start checkout.
          </p>
        </div>
      )}

      {missingDeliveryLocation && (
        <div className='mb-4 rounded-lg border border-primary/30 bg-primary/10 p-4'>
          <p className='font-semibold text-primary'>
            Confirm your delivery location so we can check the {deliveryRadiusKm || 10} km delivery
            radius.
          </p>
        </div>
      )}

      {outsideDeliveryRadius && (
        <CartAvailabilityBanner
          tone='danger'
          icon={<XCircle className='size-5' aria-hidden='true' />}
          title='Address outside delivery radius'
          message={`${restaurantName} delivers within ${deliveryRadiusKm?.toFixed(
            1
          )} km. Your selected address is about ${deliveryDistanceKm?.toFixed(
            1
          )} km from the restaurant.`}
        />
      )}

      {blockingCartItems.length > 0 && (
        <div className='mb-4 rounded-lg border border-red-300 bg-red-100 p-4 dark:border-red-700 dark:bg-red-900/20'>
          <div className='flex gap-3'>
            <XCircle className='mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-300' />
            <div className='min-w-0'>
              <p className='font-semibold text-red-800 dark:text-red-200'>
                Some cart items need attention
              </p>
              <p className='mt-1 text-sm text-red-700 dark:text-red-200'>
                {cartValidationMessage ||
                  'Remove unavailable, deleted, or invalid items before checkout.'}
              </p>
              <div className='mt-3 grid gap-2'>
                {blockingCartItems.map((item) => {
                  const validation = cartValidationByKey.get(getCartItemKey(item));

                  return (
                    <div
                      key={getCartItemKey(item)}
                      className='rounded-md border border-red-300/70 bg-background/70 p-3 text-sm dark:border-red-800/70'
                    >
                      <p className='font-medium text-foreground'>{validation?.name || item.name}</p>
                      <p className='mt-1 text-xs text-red-700 dark:text-red-200'>
                        {validation?.message || 'This item cannot be ordered right now.'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <Button type='button' onClick={handleRemoveBlockingCartItems} className='mt-3'>
            Remove unavailable items
          </Button>
        </div>
      )}

      {priceChangedCartItems.length > 0 && blockingCartItems.length === 0 && (
        <div className='mb-4 rounded-lg border border-amber-300 bg-amber-100 p-4 dark:border-amber-700 dark:bg-amber-900/20'>
          <div className='flex gap-3'>
            <RefreshCw className='mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-300' />
            <div className='min-w-0'>
              <p className='font-semibold text-amber-800 dark:text-amber-200'>
                Cart prices were refreshed
              </p>
              <p className='mt-1 text-sm text-amber-700 dark:text-amber-200'>
                Checkout will use the current menu prices. Your cart total has already been
                recalculated.
              </p>
              <div className='mt-3 grid gap-2'>
                {priceChangedCartItems.map((item) => {
                  const validation = cartValidationByKey.get(getCartItemKey(item));
                  const previousPrice =
                    typeof validation?.previousPrice === 'number'
                      ? validation.previousPrice
                      : item.price;
                  const currentPrice =
                    typeof validation?.price === 'number' && Number.isFinite(validation.price)
                      ? validation.price
                      : item.price;

                  return (
                    <div
                      key={getCartItemKey(item)}
                      className='flex flex-col gap-1 rounded-md border border-amber-300/70 bg-background/70 p-3 text-sm dark:border-amber-800/70 sm:flex-row sm:items-center sm:justify-between'
                    >
                      <span className='font-medium text-foreground'>
                        {validation?.name || item.name}
                      </span>
                      <span className='font-mono text-xs font-semibold text-amber-700 dark:text-amber-200'>
                        ${Number(previousPrice || 0).toFixed(2)} -&gt; $
                        {Number(currentPrice || 0).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2'>
          <CartItems
            cartItems={cartItems}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            clearCart={clearCart}
            validationItems={cartValidationItems}
          />
        </div>

        <div className='lg:col-span-1 space-y-4'>
          <DeliveryInformation
            email={profileData?.email || ''}
            formData={formData}
            handleInputChange={handleInputChange}
            deliveryRadiusKm={deliveryRadiusKm}
            deliveryDistanceKm={deliveryDistanceKm}
            outsideDeliveryRadius={outsideDeliveryRadius}
            isGettingDeliveryLocation={isGettingDeliveryLocation}
            onUseCurrentLocation={handleUseCurrentLocation}
            onManualLocationUpdate={handleManualDeliveryLocationUpdate}
            savedAddresses={savedDeliveryAddresses}
            isLoggedIn={isLoggedIn}
            selectedAddressId={selectedDeliveryAddressId}
            loadingSavedAddresses={loadingSavedDeliveryAddresses}
            savingDeliveryAddress={createDeliveryAddress.isPending}
            deletingDeliveryAddress={deleteAddress.isPending}
            settingDefaultDeliveryAddress={setDefaultAddress.isPending}
            canSaveDeliveryAddress={canSaveDeliveryAddress}
            onSelectSavedAddress={handleSelectSavedAddress}
            onSaveCurrentAddress={handleSaveCurrentDeliveryAddress}
            onDeleteSelectedAddress={handleDeleteSelectedDeliveryAddress}
            onSetDefaultAddress={handleSetDefaultDeliveryAddress}
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
            bestCouponCode={bestCoupon?.coupon.code || null}
            bestCouponDiscount={bestCoupon?.discountAmount || 0}
            bestCouponApplied={Boolean(
              appliedCoupon?.code && bestCoupon?.coupon.code === appliedCoupon.code
            )}
            isLoadingBestCoupon={isLoadingBestCoupon}
            onCouponCodeChange={handleCouponCodeChange}
            onApplyCoupon={handleApplyCoupon}
            onApplyBestCoupon={handleApplyBestCoupon}
            isLoggedIn={isLoggedIn}
            isSubmitting={isSubmitting}
            handleCheckout={handleCheckout}
            restaurantsOpen={restaurantOpen && !multipleRestaurants}
            restaurantAcceptingCheckout={restaurantAcceptingCheckout}
            restaurantPaused={restaurantPaused}
            restaurantBusy={restaurantBusy}
            belowMinimumOrderAmount={belowMinimumOrderAmount}
            minimumOrderAmount={minimumOrderAmount}
            missingDeliveryLocation={missingDeliveryLocation}
            outsideDeliveryRadius={outsideDeliveryRadius}
            loadingRestaurants={loadingRestaurants}
            hasUnavailableItems={blockingCartItems.length > 0}
            loadingMenuAvailability={loadingMenuAvailability}
          />
        </div>
      </div>
    </div>
  );
};

export default CartPage;
