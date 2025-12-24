'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Title from '@/components/shared/Title';
import useProfile from '@/contexts/UseProfile';
import MyOrdersTable from './MyOrdersTable';

type OrderType = {
  _id: string;
  email: string;
  total: number;
  paid: boolean;
  createdAt: string;
};

const MyOrdersPage = () => {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { data, loading } = useProfile();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (loading || !data?.email) return;

    const currentPage = Math.max(1, parseInt(searchParams?.get('page') || '1', 10));
    setPage(currentPage);

    const fetchOrders = async () => {
      try {
        setLoadingOrders(true);
        const res = await fetch(`/api/my-orders?page=${currentPage}`);

        if (!res.ok) {
          throw new Error('Failed to fetch orders');
        }

        const json = await res.json();
        setOrders(json.orders || []);
        setTotalPages(json.totalPages || 1);
      } catch (error) {
        console.error('Failed to load orders', error);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [loading, data?.email, searchParams]);

  if (loading) return 'Loading user info...';
  if (!data?.email) return 'Please sign in to view your orders';

  return (
    <section className='mt-8 flex flex-col min-h-[calc(100vh-8rem)]'>
      <Title>My Orders</Title>

      <div className='mt-8 flex-1 flex flex-col'>
        <div className='flex-1'>
          <MyOrdersTable orders={orders} loading={loadingOrders} />
        </div>

        <div className='mt-auto pt-4 pb-4'>
          <div className='flex items-center justify-center gap-6 px-4 py-3 bg-white rounded-lg'>
            <button
              onClick={() => {
                const prev = Math.max(1, page - 1);
                router.push(`/my-orders?page=${prev}`);
              }}
              disabled={page <= 1}
              className='px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition'
            >
              Previous
            </button>

            <div className='text-sm font-medium text-gray-700 whitespace-nowrap'>
              Page {page} of {totalPages}
            </div>

            <button
              onClick={() => {
                const next = Math.min(totalPages, page + 1);
                router.push(`/my-orders?page=${next}`);
              }}
              disabled={page >= totalPages}
              className='px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition'
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const MyOrdersPageWithSuspense = () => (
  <Suspense fallback={<p className='mt-8'>Loading page...</p>}>
    <MyOrdersPage />
  </Suspense>
);

export default MyOrdersPageWithSuspense;