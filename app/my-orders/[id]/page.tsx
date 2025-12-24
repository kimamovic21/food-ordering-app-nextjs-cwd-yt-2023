'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
// UserTabs removed; tabs are now in Header
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
};

const MyOrderDetailPage = () => {
  const [order, setOrder] = useState<OrderDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { data: profileData, loading: profileLoading } = useProfile();
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  useEffect(() => {
    if (profileLoading || !profileData?.email) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
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
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId, profileData?.email, profileLoading, router]);

  if (profileLoading) return 'Loading user info...';
  if (!profileData?.email) return 'Please sign in to view your order';

  if (loading) return <div className='mt-8'>Loading order details...</div>;

  if (error) return <div className='mt-8 text-red-600'>{error}</div>;

  if (!order) return <div className='mt-8'>Order not found</div>;

  return (
    <section className='mt-8'>

      <div className='mt-8 max-w-4xl mx-auto'>
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-3xl font-bold'>Order Details</h1>
          <Link
            href='/my-orders'
            className='px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium'
          >
            ← Back
          </Link>
        </div>

        <div className='space-y-6'>
          <OrderInfoCard
            orderId={order._id}
            paid={order.paid}
            createdAt={order.createdAt}
          />

          <CustomerInfoCard
            email={order.email}
            phone={order.phone}
            streetAddress={order.streetAddress}
            postalCode={order.postalCode}
            city={order.city}
            country={order.country}
          />

          <OrderItemsCard
            cartProducts={order.cartProducts}
            total={order.total}
          />
        </div>
      </div>
    </section>
  );
};

export default MyOrderDetailPage;