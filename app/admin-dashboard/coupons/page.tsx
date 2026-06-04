'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit3, Plus, TicketPercent, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Title from '@/components/shared/Title';
import useProfile from '@/hooks/useProfile';
import CouponsLoading from './loading';

type Coupon = {
  _id: string;
  code: string;
  title: string;
  description: string;
  discountValue: number;
  minimumOrderAmount: number;
  usageLimit: number | null;
  usageCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

const CouponsPage = () => {
  const { data, loading } = useProfile();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [noRestaurant, setNoRestaurant] = useState(false);

  const currentPage = useMemo(() => {
    return Math.max(1, parseInt(searchParams?.get('page') || '1', 10));
  }, [searchParams]);

  const fetchCoupons = async (pageToLoad = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoadingCoupons(true);
      }

      const response = await fetch(`/api/coupons?page=${pageToLoad}&limit=5`);
      const json = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setNoRestaurant(true);
          setCoupons([]);
          return;
        }

        throw new Error(json.error || 'Failed to load coupons');
      }

      setNoRestaurant(false);
      setTotalPages(json.totalPages || 1);
      setPage(json.page || pageToLoad);
      setCoupons((previous) =>
        append ? [...previous, ...(json.coupons || [])] : json.coupons || []
      );
    } catch (error) {
      console.error('Failed to load coupons', error);
      toast.error('Failed to load coupons', {
        style: { background: '#ef4444', color: 'white' },
      });
    } finally {
      setLoadingCoupons(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (loading) return;

    if (!data?.role || data.role !== 'admin') {
      router.push('/');
      return;
    }

    setCoupons([]);
    setNoRestaurant(false);
    fetchCoupons(currentPage, false);
  }, [currentPage, data?.role, loading, router]);

  const handleDelete = async (couponId: string) => {
    try {
      const response = await fetch(`/api/coupons?id=${encodeURIComponent(couponId)}`, {
        method: 'DELETE',
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(json?.error || 'Failed to delete coupon');
      }

      toast.success('Coupon deleted successfully', {
        style: { background: '#22c55e', color: 'white' },
      });
      fetchCoupons(1, false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete coupon';
      toast.error(message, {
        style: { background: '#ef4444', color: 'white' },
      });
    }
  };

  if (loading || loadingCoupons) {
    return <CouponsLoading />;
  }

  if (!data?.role || data.role !== 'admin') return 'Not an admin';

  if (noRestaurant) {
    return (
      <section className='mt-8 flex flex-col min-h-[calc(100vh-8rem)] max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10'>
        <Title>Coupons</Title>
        <Card className='mt-8 border border-border bg-card text-card-foreground shadow-sm px-6 sm:px-10'>
          <div className='py-20 sm:py-24 text-center flex flex-col items-center justify-center'>
            <h3 className='text-xl font-semibold mb-4'>Create your restaurant first</h3>
            <p className='text-muted-foreground mb-8 max-w-md'>
              Coupons are tied to a single restaurant, so you need a restaurant before creating one.
            </p>
            <Button asChild>
              <Link href='/admin-dashboard/restaurant'>Create Restaurant</Link>
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className='mt-8 flex flex-col min-h-[calc(100vh-8rem)] max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <Title>Coupons</Title>
          <p className='mt-2 text-sm text-muted-foreground'>
            Manage restaurant-only discounts for your customers.
          </p>
        </div>
        <Button asChild className='rounded-full gap-2'>
          <Link href='/admin-dashboard/coupons/create-coupon'>
            <Plus className='h-4 w-4' />
            Create Coupon
          </Link>
        </Button>
      </div>

      {coupons.length === 0 ? (
        <Card className='mt-8 border border-border bg-card text-card-foreground shadow-sm px-6 sm:px-10'>
          <div className='py-20 sm:py-24 text-center flex flex-col items-center justify-center'>
            <TicketPercent className='h-12 w-12 text-muted-foreground mb-4' />
            <h3 className='text-xl font-semibold mb-4'>No coupons yet</h3>
            <p className='text-muted-foreground mb-8 max-w-md'>
              Create a coupon for your restaurant and start offering discounts to customers.
            </p>
            <Button asChild>
              <Link href='/admin-dashboard/coupons/create-coupon'>Create Coupon</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className='mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {coupons.map((coupon) => {
            const isExpired = coupon.expiresAt
              ? new Date(coupon.expiresAt).getTime() < Date.now()
              : false;
            const statusLabel = !coupon.isActive ? 'Inactive' : isExpired ? 'Expired' : 'Active';

            return (
              <Card
                key={coupon._id}
                className='border border-border bg-card text-card-foreground shadow-sm'
              >
                <CardHeader className='space-y-3'>
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <CardTitle className='text-xl'>{coupon.title}</CardTitle>
                      <CardDescription className='mt-1 font-mono text-sm'>
                        {coupon.code}
                      </CardDescription>
                    </div>
                    <Badge variant={statusLabel === 'Active' ? 'default' : 'secondary'}>
                      {statusLabel}
                    </Badge>
                  </div>
                  <div className='flex items-center gap-2 text-2xl font-bold'>
                    <TicketPercent className='h-5 w-5 text-primary' />
                    {coupon.discountValue}% off food
                  </div>
                </CardHeader>

                <CardContent className='space-y-4'>
                  <p className='text-sm text-muted-foreground leading-relaxed'>
                    {coupon.description}
                  </p>

                  <div className='grid gap-3 text-sm'>
                    <div className='flex items-center justify-between gap-4 rounded-lg bg-muted/50 px-3 py-2'>
                      <span className='text-muted-foreground'>Minimum order</span>
                      <span className='font-semibold'>${coupon.minimumOrderAmount.toFixed(2)}</span>
                    </div>
                    <div className='flex items-center justify-between gap-4 rounded-lg bg-muted/50 px-3 py-2'>
                      <span className='text-muted-foreground'>Usage</span>
                      <span className='font-semibold'>
                        {coupon.usageCount}
                        {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
                      </span>
                    </div>
                    <div className='flex items-center justify-between gap-4 rounded-lg bg-muted/50 px-3 py-2'>
                      <span className='text-muted-foreground'>Expires</span>
                      <span className='font-semibold'>
                        {coupon.expiresAt
                          ? new Date(coupon.expiresAt).toLocaleDateString()
                          : 'Never'}
                      </span>
                    </div>
                  </div>

                  <div className='flex flex-col gap-2 sm:flex-row'>
                    <Button asChild variant='outline' className='flex-1 gap-2'>
                      <Link href={`/admin-dashboard/coupons/edit/${coupon._id}`}>
                        <Edit3 className='h-4 w-4' />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant='outline'
                      className='flex-1 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50'
                      onClick={() => handleDelete(coupon._id)}
                    >
                      <Trash2 className='h-4 w-4' />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {page < totalPages && coupons.length > 0 && (
        <div className='mt-8 flex justify-center'>
          <Button
            variant='outline'
            onClick={() => fetchCoupons(page + 1, true)}
            disabled={loadingMore}
            className='rounded-full px-8'
          >
            {loadingMore ? 'Loading more...' : 'Load more'}
          </Button>
        </div>
      )}

      {coupons.length > 0 && page >= totalPages && (
        <p className='mt-6 text-center text-sm text-muted-foreground'>No more coupons to load.</p>
      )}
    </section>
  );
};

const CouponsPageWithSuspense = () => (
  <Suspense fallback={<p className='mt-8'>Loading page...</p>}>
    <CouponsPage />
  </Suspense>
);

export default CouponsPageWithSuspense;
