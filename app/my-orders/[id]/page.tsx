'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import useProfile from '@/hooks/useProfile';
import OrderInfoCard from './OrderInfoCard';
import CustomerInfoCard from './CustomerInfoCard';
import OrderItemsCard from './OrderItemsCard';
import OrderStatusBanner from './OrderStatusBanner';
import LeaveReviewDialog from './LeaveReviewDialog';
import LeaveCourierReviewDialog from './LeaveCourierReviewDialog';
import Title from '@/components/shared/Title';
import OrderElapsedTime from '@/components/shared/OrderElapsedTime';
import HeartRating from '@/components/shared/HeartRating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import OrderPhaseTimeline from '@/components/shared/OrderPhaseTimeline';
import ReportProblemDialog from '@/components/shared/ReportProblemDialog';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';

type CartProduct = {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
};

type OrderDetailsType = {
  _id: string;
  userId: string;
  email: string;
  phone: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  country: string;
  specialInstructions?: string;
  cartProducts: CartProduct[];
  total: number;
  paymentStatus: boolean;
  orderStatus:
    | 'placed'
    | 'processing'
    | 'ready'
    | 'transportation'
    | 'delivered'
    | 'completed'
    | 'canceled';
  createdAt: string;
  processingAt?: string | null;
  readyAt?: string | null;
  transportationAt?: string | null;
  courierDeliveredAt?: string | null;
  customerConfirmedDeliveryAt?: string | null;
  adminConfirmedDeliveryAt?: string | null;
  deliveryCompletedBy?: 'customer' | 'admin' | null;
  deliveryPin?: string | null;
  canceledAt?: string | null;
  completedAt?: string | null;
  taxPercentage?: number;
  taxAmount?: number;
  deliveryFee?: number;
  estimatedPreparationMinutes?: number | null;
  estimatedDeliveryMinutes?: number | null;
  estimatedTotalMinutes?: number | null;
  loyaltyDiscount?: number;
  loyaltyDiscountPercentage?: number;
  loyaltyTier?: string;
  restaurantId?: string;
  courier?: {
    _id: string;
    name: string;
    email: string;
    image?: string | null;
  } | null;
};

type OrderReviewType = {
  rating: number;
  reviewText: string;
  createdAt?: string;
};

// Map loads client-side only because Leaflet touches window during module init
const OrderMap = dynamic(() => import('@/components/shared/OrderMap'), {
  ssr: false,
  loading: () => (
    <div className='border rounded-lg p-4 h-[300px] flex items-center justify-center bg-slate-50 dark:bg-slate-900'>
      <Skeleton className='h-6 w-40' />
    </div>
  ),
});

import { useRef } from 'react';

const MyOrderDetailPage = () => {
  const [order, setOrder] = useState<OrderDetailsType | null>(null);
  const [restaurantReview, setRestaurantReview] = useState<OrderReviewType | null>(null);
  const [courierReview, setCourierReview] = useState<OrderReviewType | null>(null);
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [cancelingOrder, setCancelingOrder] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { data: profileData, loading: profileLoading } = useProfile();
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (profileLoading || !profileData?.email) return;

    const fetchOrder = async () => {
      try {
        if (isFirstLoad.current) setLoading(true);
        const res = await fetch(`/api/my-orders?id=${orderId}`);

        if (res.status === 403) {
          // Order doesn't belong to user, redirect
          router.push('/my-orders');
          return;
        }

        if (!res.ok) {
          throw new Error('Failed to fetch order');
        }

        const json = await res.json();
        setOrder(json.order);

        try {
          const reviewResponse = await fetch(`/api/reviews?orderId=${orderId}`);
          if (reviewResponse.ok) {
            const reviewJson = await reviewResponse.json();
            setRestaurantReview(reviewJson.review ?? null);
          } else {
            setRestaurantReview(null);
          }
        } catch (reviewErr) {
          console.error('Failed to load review', reviewErr);
          setRestaurantReview(null);
        }

        try {
          const reviewResponse = await fetch(`/api/courier-reviews?orderId=${orderId}`);
          if (reviewResponse.ok) {
            const reviewJson = await reviewResponse.json();
            setCourierReview(reviewJson.review ?? null);
          } else {
            setCourierReview(null);
          }
        } catch (reviewErr) {
          console.error('Failed to load courier review', reviewErr);
          setCourierReview(null);
        }
      } catch (err) {
        console.error('Failed to load order', err);
        setError('Failed to load order details');
      } finally {
        if (isFirstLoad.current) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          setLoading(false);
          isFirstLoad.current = false;
        }
      }
    };

    if (orderId) {
      fetchOrder();

      // Poll for order updates every 10 seconds, regardless of status
      const pollInterval = setInterval(() => {
        fetchOrder();
      }, 10000);

      return () => clearInterval(pollInterval);
    }
  }, [orderId, profileData?.email, profileLoading, router]);

  if (profileLoading) {
    return (
      <section className='mt-8'>
        <div className='mt-8 max-w-[1600px] mx-auto px-4'>
          <div className='flex items-center gap-2 mb-6'>
            <Skeleton className='h-5 w-16' />
            <Skeleton className='h-4 w-4' />
            <Skeleton className='h-5 w-32' />
          </div>
          <Skeleton className='h-10 w-56 mb-6' />

          {/* Status banner skeleton */}
          <div className='rounded-lg border border-border bg-card/70 p-6 mb-6'>
            <div className='flex items-start gap-3'>
              <Skeleton className='h-10 w-10 rounded-full' />
              <div className='flex-1 space-y-2'>
                <Skeleton className='h-5 w-48' />
                <Skeleton className='h-4 w-72' />
                <Skeleton className='h-4 w-64' />
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
            <div className='space-y-6'>
              {[...Array(2)].map((_, idx) => (
                <Card
                  key={idx}
                  className='p-6 bg-card text-card-foreground border border-border shadow-sm'
                >
                  <div className='space-y-5'>
                    <Skeleton className='h-6 w-64' />
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <Skeleton className='h-4 w-56' />
                      <Skeleton className='h-6 w-16 rounded-full' />
                      <Skeleton className='h-4 w-40' />
                      <Skeleton className='h-5 w-72' />
                      <Skeleton className='h-4 w-32' />
                      <Skeleton className='h-5 w-60' />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <Card className='p-6 bg-card border border-border shadow-sm'>
              <div className='space-y-5'>
                <Skeleton className='h-6 w-64' />
                <div className='space-y-3'>
                  {[...Array(4)].map((_, idx) => (
                    <Skeleton key={idx} className='h-5 w-full' />
                  ))}
                  <Skeleton className='h-5 w-4/5' />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    );
  }
  if (!profileData?.email) return 'Please sign in to view your order';

  if (loading) {
    return (
      <section className='mt-8'>
        <div className='mt-8 max-w-[1600px] mx-auto px-4'>
          <div className='flex items-center gap-2 mb-6'>
            <Skeleton className='h-5 w-16' />
            <Skeleton className='h-4 w-4' />
            <Skeleton className='h-5 w-32' />
          </div>
          <Skeleton className='h-10 w-56 mb-6' />

          {/* Status banner skeleton */}
          <div className='rounded-lg border border-border bg-card/70 p-6 mb-6'>
            <div className='flex items-start gap-3'>
              <Skeleton className='h-10 w-10 rounded-full' />
              <div className='flex-1 space-y-2'>
                <Skeleton className='h-5 w-48' />
                <Skeleton className='h-4 w-72' />
                <Skeleton className='h-4 w-64' />
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
            <div className='space-y-6'>
              {[...Array(2)].map((_, idx) => (
                <Card key={idx} className='p-6 bg-card border border-border shadow-sm'>
                  <div className='space-y-5'>
                    <Skeleton className='h-6 w-64' />
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <Skeleton className='h-4 w-56' />
                      <Skeleton className='h-6 w-16 rounded-full' />
                      <Skeleton className='h-4 w-40' />
                      <Skeleton className='h-5 w-72' />
                      <Skeleton className='h-4 w-32' />
                      <Skeleton className='h-5 w-60' />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <Card className='p-6 bg-card border border-border shadow-sm'>
              <div className='space-y-5'>
                <Skeleton className='h-6 w-64' />
                <div className='space-y-3'>
                  {[...Array(4)].map((_, idx) => (
                    <Skeleton key={idx} className='h-5 w-full' />
                  ))}
                  <Skeleton className='h-5 w-4/5' />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    );
  }

  if (error) return <div className='mt-8 text-red-600'>{error}</div>;

  if (!order) return <div className='mt-8'>Order not found</div>;

  const handleConfirmDelivery = async () => {
    if (!order) return;

    setConfirmingDelivery(true);

    try {
      const response = await fetch('/api/my-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order._id, action: 'confirm-delivery' }),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Failed to confirm delivery');
      }

      setOrder(json.order);
      setConfirmDialogOpen(false);
      sonnerToast.success('Delivery confirmed. Thank you!', {
        style: {
          background: '#22c55e',
          color: 'white',
        },
      });
    } catch (error) {
      sonnerToast.error(error instanceof Error ? error.message : 'Failed to confirm delivery', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
    } finally {
      setConfirmingDelivery(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    setCancelingOrder(true);

    try {
      const response = await fetch('/api/my-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order._id, action: 'cancel-order' }),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Failed to cancel order');
      }

      setOrder(json.order);
      setCancelDialogOpen(false);
      sonnerToast.success('Order canceled', {
        style: {
          background: '#22c55e',
          color: 'white',
        },
      });
    } catch (error) {
      sonnerToast.error(error instanceof Error ? error.message : 'Failed to cancel order', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
    } finally {
      setCancelingOrder(false);
    }
  };

  return (
    <section className='mt-8'>
      <div className='mt-8 max-w-[1600px] mx-auto px-4'>
        <Breadcrumb className='mb-6'>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href='/my-orders'>My Orders</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Order Details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className='flex items-center justify-between mb-6'>
          <Title>Order Details</Title>
          <div className='text-right space-y-3'>
            <p className='text-sm text-muted-foreground mb-1'>Order Time</p>
            <OrderElapsedTime
              createdAt={order.createdAt}
              completedAt={order.completedAt || order.canceledAt}
              isCompleted={order.orderStatus === 'completed' || order.orderStatus === 'canceled'}
            />
            {!restaurantReview && (
              <LeaveReviewDialog
                orderId={order._id}
                orderStatus={order.orderStatus}
                paymentStatus={order.paymentStatus}
                onSubmitted={(nextReview) => setRestaurantReview(nextReview)}
              />
            )}
            {!courierReview && (
              <LeaveCourierReviewDialog
                orderId={order._id}
                orderStatus={order.orderStatus}
                paymentStatus={order.paymentStatus}
                hasCourier={Boolean(order.courier?._id)}
                onSubmitted={(nextReview) => setCourierReview(nextReview)}
              />
            )}
            {order.orderStatus !== 'canceled' && <ReportProblemDialog orderId={order._id} />}
          </div>
        </div>

        <OrderStatusBanner
          status={order.orderStatus}
          estimatedPreparationMinutes={order.estimatedPreparationMinutes}
          estimatedDeliveryMinutes={order.estimatedDeliveryMinutes}
        />

        {order.specialInstructions?.trim() && (
          <Card className='mb-6'>
            <CardHeader>
              <CardTitle>Special Instructions</CardTitle>
              <CardDescription>Notes shared with the restaurant and courier.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='whitespace-pre-wrap text-sm leading-relaxed'>
                {order.specialInstructions}
              </p>
            </CardContent>
          </Card>
        )}

        {!order.paymentStatus && order.orderStatus === 'placed' && (
          <Card className='mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'>
            <CardHeader>
              <CardTitle>Cancel Order</CardTitle>
              <CardDescription>
                You can cancel this unpaid order before the restaurant starts preparing it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant='destructive' onClick={() => setCancelDialogOpen(true)}>
                Cancel order
              </Button>
            </CardContent>
          </Card>
        )}

        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
              <AlertDialogDescription>
                This cancels the unpaid order before the restaurant starts preparing it. You can
                place a new order afterward.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={cancelingOrder}>Keep order</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancelOrder} disabled={cancelingOrder}>
                {cancelingOrder ? 'Canceling...' : 'Cancel order'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {(order.orderStatus === 'transportation' || order.orderStatus === 'delivered') && (
          <Card className='mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'>
            <CardHeader>
              <CardTitle>
                {order.orderStatus === 'delivered' ? 'Confirm Delivery' : 'Delivery PIN'}
              </CardTitle>
              <CardDescription>
                {order.orderStatus === 'delivered'
                  ? 'The courier entered your delivery PIN and marked this order as delivered. Confirm once you have received your food.'
                  : 'Share this PIN with the courier only when your food arrives.'}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {order.deliveryPin && (
                <div className='rounded-lg border border-amber-200 bg-white p-4 dark:border-amber-800 dark:bg-black/20'>
                  <p className='text-sm text-muted-foreground'>Your delivery PIN</p>
                  <p className='font-mono text-3xl font-bold tracking-widest'>
                    {order.deliveryPin}
                  </p>
                </div>
              )}
              {order.orderStatus === 'delivered' && (
                <Button onClick={() => setConfirmDialogOpen(true)} className='w-full sm:w-auto'>
                  I received this order
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm delivery?</AlertDialogTitle>
              <AlertDialogDescription>
                Confirm only if you received order #{order._id.slice(-8).toUpperCase()}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={confirmingDelivery}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelivery} disabled={confirmingDelivery}>
                {confirmingDelivery ? 'Confirming...' : 'Confirm delivery'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Grid layout: On large screens, left column has Order Info + Delivery Info, right column has Order Items */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
          {/* Left column: Order Information and Delivery Information */}
          <div className='space-y-6'>
            <OrderInfoCard
              orderId={order._id}
              paymentStatus={order.paymentStatus}
              orderStatus={order.orderStatus}
              createdAt={order.createdAt}
              deliveryFee={order.deliveryFee}
              taxPercentage={order.taxPercentage}
              taxAmount={order.taxAmount}
            />

            <CustomerInfoCard
              email={order.email}
              phone={order.phone}
              streetAddress={order.streetAddress}
              postalCode={order.postalCode}
              city={order.city}
              country={order.country}
            />

            <Card>
              <CardHeader>
                <CardTitle>Courier Information</CardTitle>
                <CardDescription>
                  {order.courier?._id
                    ? 'This courier handled your delivery.'
                    : 'Courier has not been assigned yet.'}
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {order.courier?._id ? (
                  <>
                    <div className='flex items-center gap-3'>
                      <Avatar className='size-12'>
                        <AvatarImage
                          src={order.courier.image || undefined}
                          alt={order.courier.name}
                        />
                        <AvatarFallback>
                          {order.courier.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className='font-medium'>{order.courier.name}</p>
                        <p className='text-sm text-muted-foreground'>{order.courier.email}</p>
                      </div>
                    </div>

                    <Button asChild variant='secondary' className='w-full sm:w-auto'>
                      <Link href={`/my-orders/${order._id}/courier/${order.courier._id}`}>
                        View courier reviews and ratings
                      </Link>
                    </Button>
                  </>
                ) : (
                  <p className='text-sm text-muted-foreground'>
                    You will see courier details here once a courier accepts your order.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column: Order Items */}
          <div>
            <OrderItemsCard
              cartProducts={order.cartProducts}
              total={order.total}
              taxPercentage={order.taxPercentage}
              taxAmount={order.taxAmount}
              deliveryFee={order.deliveryFee}
              loyaltyDiscount={order.loyaltyDiscount}
              loyaltyDiscountPercentage={order.loyaltyDiscountPercentage}
              loyaltyTier={order.loyaltyTier}
            />
          </div>
        </div>

        {/* Map section in a Card, styled like /orders/[id] */}
        {order.orderStatus !== 'completed' &&
          order.orderStatus !== 'delivered' &&
          order.orderStatus !== 'canceled' && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {order.orderStatus === 'transportation'
                    ? 'Delivery Tracking'
                    : 'Delivery Location'}
                </CardTitle>
                <CardDescription>
                  {order.orderStatus === 'transportation'
                    ? 'Track the real-time location of the delivery.'
                    : "Customer's delivery address location."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='h-[400px] rounded-lg overflow-hidden'>
                  <OrderMap
                    address={order.streetAddress}
                    city={order.city}
                    postalCode={order.postalCode}
                    country={order.country}
                    customerEmail={order.email}
                    orderId={order._id}
                  />
                </div>
              </CardContent>
            </Card>
          )}

        {order.orderStatus !== 'canceled' && (
          <div className='mt-6'>
            <OrderPhaseTimeline
              createdAt={order.createdAt}
              processingAt={order.processingAt}
              readyAt={order.readyAt}
              transportationAt={order.transportationAt}
              courierDeliveredAt={order.courierDeliveredAt}
              completedAt={order.completedAt}
              orderStatus={order.orderStatus}
              estimatedPreparationMinutes={order.estimatedPreparationMinutes}
              estimatedDeliveryMinutes={order.estimatedDeliveryMinutes}
              estimatedTotalMinutes={order.estimatedTotalMinutes}
            />
          </div>
        )}

        {restaurantReview && (
          <Card>
            <CardHeader>
              <CardTitle>Your Restaurant Review and Rating for This Order</CardTitle>
              <CardDescription>Thank you for sharing your feedback.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <HeartRating rating={restaurantReview.rating} />
              <p className='text-sm leading-relaxed text-foreground'>
                {restaurantReview.reviewText}
              </p>
            </CardContent>
          </Card>
        )}

        {courierReview && (
          <Card>
            <CardHeader>
              <CardTitle>Your Courier Review and Rating for This Order</CardTitle>
              <CardDescription>Thank you for rating your delivery experience.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <HeartRating rating={courierReview.rating} />
              <p className='text-sm leading-relaxed text-foreground'>{courierReview.reviewText}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
};

export default MyOrderDetailPage;
