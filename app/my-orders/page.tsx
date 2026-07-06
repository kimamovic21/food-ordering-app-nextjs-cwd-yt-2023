'use client';

import { Suspense, useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import useProfile from '@/hooks/useProfile';
import Title from '@/components/shared/Title';
import MyOrdersTable from './MyOrdersTable';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
import { useCart, type CartItem } from '@/contexts/CartContext';
import { formatAppDate } from '@/libs/dateFormat';

type OrderType = {
  _id: string;
  email: string;
  total: number;
  paymentStatus: boolean;
  orderStatus:
    'placed' | 'processing' | 'ready' | 'transportation' | 'delivered' | 'completed' | 'canceled';
  createdAt: string;
};

type UsualOrderType = {
  orderId: string;
  repeatCount: number;
  lastOrderedAt: string;
  itemCount: number;
  subtotal: number;
  items: { name: string; size: string; quantity: number }[];
  cartItems: CartItem[];
};

const MyOrdersPage = () => {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [usualOrder, setUsualOrder] = useState<UsualOrderType | null>(null);
  const [loadingUsualOrder, setLoadingUsualOrder] = useState(true);
  const [addingUsualOrder, setAddingUsualOrder] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { data, loading } = useProfile();
  const { replaceCart } = useCart();
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
        await new Promise((resolve) => setTimeout(resolve, 500));
        setLoadingOrders(false);
      }
    };

    const fetchUsualOrder = async () => {
      try {
        setLoadingUsualOrder(true);
        const response = await fetch('/api/my-orders/usual', { cache: 'no-store' });
        const json = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(json?.error || 'Failed to load usual order');
        }

        setUsualOrder(json?.usualOrder || null);
      } catch (error) {
        console.error('Failed to load usual order', error);
        setUsualOrder(null);
      } finally {
        setLoadingUsualOrder(false);
      }
    };

    fetchOrders();
    fetchUsualOrder();
  }, [loading, data?.email, searchParams]);

  const handleAddUsualOrder = async () => {
    if (!usualOrder?.cartItems?.length) {
      return;
    }

    try {
      setAddingUsualOrder(true);
      replaceCart(usualOrder.cartItems);
      sonnerToast.success('Your usual order was added to cart');
      router.push('/cart');
    } finally {
      setAddingUsualOrder(false);
    }
  };

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
                  {[...Array(4)].map((_, rowIdx) => (
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

  if (!data?.email) return 'Please sign in to view your orders';

  return (
    <section className='mt-8 flex flex-col min-h-[calc(100vh-8rem)] max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10'>
      <Title>My Orders</Title>

      <div className='mt-8 flex-1 flex flex-col'>
        {loadingUsualOrder ? (
          <Card className='mb-6 border border-border bg-card text-card-foreground shadow-sm'>
            <CardContent className='flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between'>
              <div className='space-y-2'>
                <Skeleton className='h-5 w-40' />
                <Skeleton className='h-4 w-72' />
              </div>
              <Skeleton className='h-10 w-32 rounded-md' />
            </CardContent>
          </Card>
        ) : usualOrder ? (
          <Card className='mb-6 border-primary/30 bg-primary/5'>
            <CardContent className='flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between'>
              <div className='min-w-0'>
                <p className='text-sm font-semibold uppercase tracking-wide text-primary'>
                  Your usual order
                </p>
                <h2 className='mt-1 text-xl font-bold'>
                  {usualOrder.itemCount} item{usualOrder.itemCount === 1 ? '' : 's'} · $
                  {usualOrder.subtotal.toFixed(2)}
                </h2>
                <p className='mt-1 text-sm text-muted-foreground'>
                  Ordered {usualOrder.repeatCount} time
                  {usualOrder.repeatCount === 1 ? '' : 's'} · last on{' '}
                  {formatAppDate(usualOrder.lastOrderedAt)}
                </p>
                <p className='mt-2 line-clamp-2 text-sm text-muted-foreground'>
                  {usualOrder.items
                    .map((item) => `${item.quantity}x ${item.name} (${item.size})`)
                    .join(', ')}
                </p>
              </div>
              <Button
                type='button'
                onClick={handleAddUsualOrder}
                disabled={addingUsualOrder}
                className='w-full shrink-0 sm:w-auto'
              >
                {addingUsualOrder ? 'Adding...' : 'Order usual'}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <div className='flex-1'>
          {loadingOrders && (
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
                    {[...Array(4)].map((_, rowIdx) => (
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

          {!loadingOrders && orders.length === 0 && <p>No orders found.</p>}

          {!loadingOrders && orders.length > 0 && (
            <MyOrdersTable
              orders={orders}
              loading={loadingOrders}
              onOrderUpdated={(updatedOrder) =>
                setOrders((currentOrders) =>
                  currentOrders.map((order) =>
                    order._id === updatedOrder._id ? { ...order, ...updatedOrder } : order
                  )
                )
              }
            />
          )}
        </div>

        <div className='mt-auto pt-4 pb-4'>
          {loadingOrders ? (
            <div className='flex items-center justify-center gap-4'>
              <Skeleton className='h-9 w-24' />
              <Skeleton className='h-5 w-28' />
              <Skeleton className='h-9 w-24' />
            </div>
          ) : orders.length > 0 ? (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={`/my-orders?page=${Math.max(1, page - 1)}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const prev = Math.max(1, page - 1);
                      router.push(`/my-orders?page=${prev}`);
                    }}
                    aria-disabled={page <= 1}
                    className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>

                <div className='flex items-center justify-center px-4 text-sm font-medium text-muted-foreground'>
                  Page {page} of {totalPages}
                </div>

                <PaginationItem>
                  <PaginationNext
                    href={`/my-orders?page=${Math.min(totalPages, page + 1)}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const next = Math.min(totalPages, page + 1);
                      router.push(`/my-orders?page=${next}`);
                    }}
                    aria-disabled={page >= totalPages}
                    className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
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
