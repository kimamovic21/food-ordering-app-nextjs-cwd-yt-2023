'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Calendar, MapPin, DollarSign } from 'lucide-react';
import useProfile from '@/contexts/UseProfile';
import Link from 'next/link';
import Title from '@/components/shared/Title';

type CartProduct = {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
};

type DeliveredOrder = {
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
  orderPaid: boolean;
  orderStatus: 'completed';
  createdAt: string;
  updatedAt: string;
};

const MyDeliveriesPage = () => {
  const { data: profileData, loading: profileLoading } = useProfile();
  const [orders, setOrders] = useState<DeliveredOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profileLoading || profileData?.role !== 'courier') return;

    const fetchDeliveredOrders = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/my-deliveries');
        if (!res.ok) {
          throw new Error('Failed to fetch delivered orders');
        }
        const data = await res.json();
        setOrders(data.orders);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveredOrders();
  }, [profileData?.role, profileLoading]);

  if (profileLoading) {
    return (
      <div className='container mx-auto px-4 py-8 max-w-7xl'>
        <div className='space-y-4'>
          <Skeleton className='h-8 w-48' />
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {[...Array(6)].map((_, idx) => (
              <Skeleton key={idx} className='h-64 w-full' />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (profileData?.role !== 'courier') {
    return (
      <div className='container mx-auto px-4 py-8 max-w-7xl'>
        <div className='text-red-500'>Unauthorized: Only couriers can access this page</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='container mx-auto px-4 py-8 max-w-7xl'>
        <Skeleton className='h-6 w-64 mb-6' />
        <Skeleton className='h-10 w-48 mb-8' />
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {[...Array(6)].map((_, idx) => (
            <Skeleton key={idx} className='h-64 w-full' />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8 max-w-7xl'>
      <Title className='mb-8'>My Deliveries</Title>

      {error && (
        <div className='bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-6'>
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className='text-center py-12'>
          <Package className='mx-auto h-12 w-12 text-gray-400 mb-4' />
          <p className='text-muted-foreground'>No completed deliveries yet.</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {orders.map((order) => (
            <Link
              key={order._id}
              href={`/my-deliveries/${order._id}`}
              className='transition-transform hover:scale-105'
            >
              <Card className='cursor-pointer hover:shadow-lg h-full'>
                <CardHeader>
                  <CardTitle className='flex items-center justify-between gap-4'>
                    <span className='text-lg'>Order #{order._id.slice(-6).toUpperCase()}</span>
                    <span className='text-sm px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'>
                      Delivered
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='flex items-start gap-2'>
                    <MapPin className='h-4 w-4 mt-1 text-muted-foreground shrink-0' />
                    <div className='text-sm'>
                      <p className='font-medium'>Delivery Address:</p>
                      <p className='text-muted-foreground'>
                        {order.streetAddress}, {order.city}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center gap-2'>
                    <Calendar className='h-4 w-4 text-muted-foreground' />
                    <div className='text-sm'>
                      <p className='text-muted-foreground'>
                        {new Date(order.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center gap-2'>
                    <DollarSign className='h-4 w-4 text-muted-foreground' />
                    <div className='text-sm'>
                      <p className='font-medium'>${order.total.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className='flex items-center gap-2'>
                    <Package className='h-4 w-4 text-muted-foreground' />
                    <div className='text-sm'>
                      <p className='text-muted-foreground'>{order.cartProducts.length} item(s)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDeliveriesPage;
