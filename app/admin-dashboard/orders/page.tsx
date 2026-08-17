'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import Title from '@/components/shared/Title';
import useProfile from '@/hooks/useProfile';
import {
  APP_NOTIFICATION_REALTIME_EVENT,
  getNotificationRealtimePayload,
  isOrderRelatedRealtimePayload,
} from '@/libs/realtimeClient';
import OrdersTable from './OrdersTable';

type OrderType = {
  _id: string;
  email: string;
  total: number;
  paymentStatus: boolean;
  orderStatus:
    'placed' | 'processing' | 'ready' | 'transportation' | 'delivered' | 'completed' | 'canceled';
  createdAt: string;
};

const OrdersPage = () => {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [operationalAlerts, setOperationalAlerts] = useState({
    activeOrders: 0,
    lateOrders: 0,
    readyWithoutCourierOrders: 0,
    lateThresholdMinutes: 120,
  });
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [noRestaurant, setNoRestaurant] = useState(false);
  const { data, loading } = useProfile();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (data?.role !== 'admin') {
      return;
    }

    const currentPage = Math.max(1, parseInt(searchParams?.get('page') || '1', 10));
    setPage(currentPage);

    const fetchOrders = async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoadingOrders(true);
        }
        const res = await fetch(`/api/orders?page=${currentPage}`);

        if (!res.ok) {
          const errorData = await res.json();
          if (res.status === 403) {
            setNoRestaurant(true);
            setError(null);
          } else {
            setError(errorData.error || 'Failed to load orders');
            setNoRestaurant(false);
          }
          return;
        }

        const json = await res.json();
        setOrders(json.orders || []);
        setTotalPages(json.totalPages || 1);
        setError(null);
        setNoRestaurant(false);

        const queueResponse = await fetch('/api/orders/queue', { cache: 'no-store' });
        if (queueResponse.ok) {
          const queueJson = await queueResponse.json();
          const queueOrders = Array.isArray(queueJson.orders) ? queueJson.orders : [];
          setOperationalAlerts({
            activeOrders: queueOrders.length,
            lateOrders: queueOrders.filter((order: any) => order.isLateBeforeTransport).length,
            readyWithoutCourierOrders: queueOrders.filter(
              (order: any) => order.isReadyWithoutCourierLate
            ).length,
            lateThresholdMinutes: Number(queueJson.lateThresholdMinutes) || 120,
          });
        }
      } catch (error) {
        console.error('Failed to load orders', error);
      } finally {
        if (showLoading) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          setLoadingOrders(false);
        }
      }
    };

    // Fetch immediately on mount with loading indicator
    fetchOrders(true);

    // Poll for order updates every 10 seconds without loading indicator
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 10000);

    const handleRealtimeOrderUpdate = (event: Event) => {
      const payload = getNotificationRealtimePayload(event);

      if (isOrderRelatedRealtimePayload(payload)) {
        void fetchOrders(false);
      }
    };

    window.addEventListener(APP_NOTIFICATION_REALTIME_EVENT, handleRealtimeOrderUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener(APP_NOTIFICATION_REALTIME_EVENT, handleRealtimeOrderUpdate);
    };
  }, [loading, data?.role, searchParams]);

  if (loading) {
    return (
      <section className='mt-8 flex flex-col min-h-[calc(100vh-8rem)] max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10'>
        <Skeleton className='h-9 w-32' />

        <div className='mt-8 flex-1 w-full'>
          <Card className='border border-border bg-card text-card-foreground shadow-sm'>
            <div className='overflow-x-auto'>
              <Table className='w-full min-w-[900px] table-fixed'>
                <TableHeader>
                  <TableRow>
                    {[...Array(7)].map((_, idx) => (
                      <TableHead key={idx} className='p-3'>
                        <Skeleton className='h-4 w-24' />
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, rowIdx) => (
                    <TableRow key={rowIdx}>
                      {[...Array(6)].map((_, cellIdx) => (
                        <TableCell key={cellIdx} className='p-3'>
                          <Skeleton className='h-4 w-full' />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        <div className='mt-6 flex items-center justify-center gap-4 pb-4'>
          <Skeleton className='h-9 w-24' />
          <Skeleton className='h-5 w-28' />
          <Skeleton className='h-9 w-24' />
        </div>
      </section>
    );
  }

  if (!data?.role || data.role !== 'admin') return 'Not an admin';

  return (
    <section className='mt-8 flex flex-col min-h-[calc(100vh-8rem)] max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10'>
      <Title>Orders</Title>

      {operationalAlerts.lateOrders > 0 && (
        <Card className='mt-4 border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100'>
          <div className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-start gap-3'>
              <AlertTriangle className='mt-0.5 size-5 shrink-0' />
              <div>
                <p className='font-semibold'>
                  {operationalAlerts.lateOrders} order
                  {operationalAlerts.lateOrders === 1 ? '' : 's'} need attention
                </p>
                <p className='text-sm opacity-90'>
                  {operationalAlerts.readyWithoutCourierOrders > 0
                    ? `${operationalAlerts.readyWithoutCourierOrders} ready order${
                        operationalAlerts.readyWithoutCourierOrders === 1 ? '' : 's'
                      } still need a courier.`
                    : `Active for at least ${operationalAlerts.lateThresholdMinutes} minutes and not out for delivery yet.`}
                </p>
              </div>
            </div>
            <Link
              href='/admin-dashboard/order-queue'
              className='rounded-md border border-red-300 px-3 py-2 text-center text-sm font-medium transition hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-950'
            >
              Open order queue
            </Link>
          </div>
        </Card>
      )}

      {error && (
        <div className='mt-4 bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-3 rounded-lg'>
          {error}
        </div>
      )}

      {noRestaurant && !error && (
        <div className='mt-8 flex-1'>
          <Card className='border border-border bg-card text-card-foreground shadow-sm px-6 sm:px-10'>
            <div className='py-20 sm:py-24 text-center flex flex-col items-center justify-center'>
              <h3 className='text-xl font-semibold mb-4'>Ready to start receiving orders?</h3>
              <p className='text-muted-foreground mb-8 max-w-md'>
                Create a restaurant to begin managing orders.
              </p>
              <button
                onClick={() => router.push('/admin-dashboard/restaurant')}
                className='bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-lg font-medium transition'
              >
                Create Restaurant
              </button>
            </div>
          </Card>
        </div>
      )}

      {!noRestaurant && (
        <div className='mt-8 flex-1 flex flex-col'>
          <div className='flex-1'>
            {!error && !noRestaurant && loadingOrders && (
              <Card className='border border-border bg-card text-card-foreground shadow-sm'>
                <div className='overflow-x-auto'>
                  <Table className='w-full min-w-[900px] table-fixed'>
                    <TableHeader>
                      <TableRow>
                        {[...Array(7)].map((_, idx) => (
                          <TableHead key={idx} className='p-3'>
                            <Skeleton className='h-4 w-24' />
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...Array(5)].map((_, rowIdx) => (
                        <TableRow key={rowIdx}>
                          {[...Array(6)].map((_, cellIdx) => (
                            <TableCell key={cellIdx} className='p-3'>
                              <Skeleton className='h-4 w-full' />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}

            {!loadingOrders && !error && !noRestaurant && orders.length === 0 && (
              <p>No orders found.</p>
            )}

            {!loadingOrders && !error && !noRestaurant && orders.length > 0 && (
              <OrdersTable orders={orders} loading={loadingOrders} />
            )}
          </div>

          <div className='mt-auto pt-4 pb-4'>
            {loadingOrders || error || noRestaurant ? (
              <div className='flex items-center justify-center gap-4'>
                {loadingOrders && (
                  <>
                    <Skeleton className='h-9 w-24' />
                    <Skeleton className='h-5 w-28' />
                    <Skeleton className='h-9 w-24' />
                  </>
                )}
              </div>
            ) : (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={`/admin-dashboard/orders?page=${Math.max(1, page - 1)}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const prev = Math.max(1, page - 1);
                        router.push(`/admin-dashboard/orders?page=${prev}`);
                      }}
                      aria-disabled={page <= 1}
                      className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>

                  <div className='flex items-center justify-center px-4 text-sm font-medium text-gray-700'>
                    Page {page} of {totalPages}
                  </div>

                  <PaginationItem>
                    <PaginationNext
                      href={`/admin-dashboard/orders?page=${Math.min(totalPages, page + 1)}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const next = Math.min(totalPages, page + 1);
                        router.push(`/admin-dashboard/orders?page=${next}`);
                      }}
                      aria-disabled={page >= totalPages}
                      className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

const OrdersPageWithSuspense = () => (
  <Suspense fallback={<p className='mt-8'>Loading page...</p>}>
    <OrdersPage />
  </Suspense>
);

export default OrdersPageWithSuspense;
