'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
import useProfile from '@/hooks/useProfile';
import Title from '@/components/shared/Title';
import CouponForm, { type CouponFormSubmitValues } from '../../CouponForm';
import EditCouponLoading from './loading';

type Coupon = {
  _id: string;
  code: string;
  title: string;
  description: string;
  discountValue: number;
  minimumOrderAmount: number;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usagePerCustomer: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  isPublic: boolean;
  firstOrderOnly: boolean;
  terms: string;
  tags: string[];
};

const EditCouponPage = () => {
  const params = useParams();
  const id = (params as any)?.id as string;
  const router = useRouter();
  const { data, loading } = useProfile();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loadingCoupon, setLoadingCoupon] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!data?.role || data.role !== 'admin') {
      router.push('/');
      return;
    }

    const fetchCoupon = async () => {
      try {
        setLoadingCoupon(true);
        const response = await fetch(`/api/coupons?id=${encodeURIComponent(id)}`);
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error || 'Failed to load coupon');
        }

        setCoupon(json.coupon);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load coupon';
        sonnerToast.error(message, {
          style: { background: '#ef4444', color: 'white' },
        });
        router.push('/admin-dashboard/coupons');
      } finally {
        setLoadingCoupon(false);
      }
    };

    if (id) {
      fetchCoupon();
    }
  }, [data?.role, id, loading, router]);

  const handleSubmit = async (values: CouponFormSubmitValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: id, ...values }),
      });
      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(json?.error || 'Failed to update coupon');
      }

      sonnerToast.success('Coupon updated successfully', {
        style: { background: '#22c55e', color: 'white' },
      });
      router.push('/admin-dashboard/coupons');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update coupon';
      sonnerToast.error(message, {
        style: { background: '#ef4444', color: 'white' },
      });
      throw new Error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || loadingCoupon) {
    return <EditCouponLoading />;
  }

  if (!data?.role || data.role !== 'admin') return 'Not an admin';

  if (!coupon) return null;

  return (
    <section className='mt-8 pb-10 max-w-4xl mx-auto'>
      <Breadcrumb className='mb-4'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href='/admin-dashboard/coupons'>Coupons</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>Edit coupon</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Title>Edit Coupon</Title>

      <Card className='mt-6 border border-border bg-card text-card-foreground shadow-sm'>
        <CardHeader>
          <CardTitle>Update coupon</CardTitle>
          <CardDescription>
            Keep the code unique for your restaurant and update the schedule or discount details as
            needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CouponForm
            submitLabel='Save Changes'
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            initialValues={coupon}
          />
        </CardContent>
      </Card>
    </section>
  );
};

export default EditCouponPage;
