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
import useProfile from '@/contexts/UseProfile';
import OrderInfoCard from './OrderInfoCard';
import CustomerInfoCard from './CustomerInfoCard';
import OrderItemsCard from './OrderItemsCard';
import OrderStatusBanner from './OrderStatusBanner';
import Title from '@/components/shared/Title';
import OrderElapsedTime from '@/components/shared/OrderElapsedTime';

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
  cartProducts: CartProduct[];
  total: number;
  paymentStatus: boolean;
  orderStatus: 'placed' | 'processing' | 'ready' | 'transportation' | 'completed';
  createdAt: string;
  completedAt?: string | null;
  taxPercentage?: number;
  taxAmount?: number;
  deliveryFee?: number;
  loyaltyDiscount?: number;
  loyaltyDiscountPercentage?: number;
  loyaltyTier?: string;
  restaurantId?: string;
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
          <div className='text-right'>
            <p className='text-sm text-muted-foreground mb-1'>Order Time</p>
            <OrderElapsedTime
              createdAt={order.createdAt}
              completedAt={order.completedAt}
              isCompleted={order.orderStatus === 'completed'}
            />
          </div>
        </div>

        <OrderStatusBanner status={order.orderStatus} />

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
        {order.orderStatus !== 'completed' && (
          <Card>
            <CardHeader>
              <CardTitle>
                {order.orderStatus === 'transportation' ? 'Delivery Tracking' : 'Delivery Location'}
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
      </div>
    </section>
  );
};

export default MyOrderDetailPage;
