'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import useProfile from '@/contexts/UseProfile';
import Link from 'next/link';
import OrderInfoCard from './OrderInfoCard';
import CustomerInfoCard from './CustomerInfoCard';
import OrderItemsCard from './OrderItemsCard';

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
  paid: boolean;
  createdAt: string;
  updatedAt: string;
  stripeSessionId?: string;
};

const OrderDetailPage = () => {
  const [order, setOrder] = useState<OrderDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { data: profileData, loading: profileLoading } = useProfile();
  const params = useParams();
  const orderId = params?.id as string;

  useEffect(() => {
    if (profileLoading || !profileData?.admin) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/orders?id=${orderId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch order');
        }
        const json = await res.json();
        setOrder(json.order);
      } catch (err) {
        console.error('Failed to load order', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId, profileData?.admin, profileLoading]);

  if (profileLoading || (loading && !order)) {
    return (
      <section className='mt-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-10'>
        <Breadcrumb className='mb-6'>
          <BreadcrumbList>
            <BreadcrumbItem>
              <Skeleton className='h-4 w-16' />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Skeleton className='h-4 w-24' />
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-full max-w-xs' />
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {[...Array(4)].map((_, idx) => (
                  <div key={idx}>
                    <Skeleton className='h-4 w-40 mb-2' />
                    <Skeleton className='h-6 w-full' />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-full max-w-xs' />
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {[...Array(6)].map((_, idx) => (
                  <div key={idx}>
                    <Skeleton className='h-4 w-40 mb-2' />
                    <Skeleton className='h-6 w-full' />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-full max-w-xs' />
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='space-y-2'>
                  {[...Array(3)].map((_, idx) => (
                    <Skeleton key={idx} className='h-12 w-full' />
                  ))}
                </div>
                <div className='border-t pt-4 space-y-2'>
                  <div className='flex justify-between'>
                    <Skeleton className='h-5 w-20' />
                    <Skeleton className='h-5 w-16' />
                  </div>
                  <div className='flex justify-between border-t pt-2'>
                    <Skeleton className='h-6 w-16' />
                    <Skeleton className='h-6 w-20' />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (!profileData?.admin) return 'Not an admin';

  if (error) return <div className='mt-8 text-red-600'>{error}</div>;

  if (!order) return <div className='mt-8'>Order not found</div>;

  return (
    <section className='mt-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-10'>
      <Breadcrumb className='mb-6'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href='/orders'>Orders</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Order Details</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className='space-y-6'>
        <OrderInfoCard
          orderId={order._id}
          paid={order.paid}
          createdAt={order.createdAt}
          updatedAt={order.updatedAt}
          stripeSessionId={order.stripeSessionId}
        />

        <CustomerInfoCard
          email={order.email}
          phone={order.phone}
          streetAddress={order.streetAddress}
          postalCode={order.postalCode}
          city={order.city}
          country={order.country}
        />

        <OrderItemsCard cartProducts={order.cartProducts} total={order.total} />
      </div>
    </section>
  );
};

export default OrderDetailPage;
