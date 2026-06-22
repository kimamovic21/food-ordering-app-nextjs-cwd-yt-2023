'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import CouponForm, { type CouponFormSubmitValues } from '../CouponForm';
import CreateCouponLoading from './loading';

const CreateCouponPage = () => {
  const router = useRouter();
  const { data, loading } = useProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && data?.role !== 'admin') {
      router.push('/');
    }
  }, [data?.role, loading, router]);

  const handleSubmit = async (values: CouponFormSubmitValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(json?.error || 'Failed to create coupon');
      }

      sonnerToast.success('Coupon created successfully', {
        style: { background: '#22c55e', color: 'white' },
      });
      router.push('/admin-dashboard/coupons');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create coupon';
      sonnerToast.error(message, {
        style: { background: '#ef4444', color: 'white' },
      });
      throw new Error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <CreateCouponLoading />;
  }

  if (!data?.role || data.role !== 'admin') return 'Not an admin';

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
          <BreadcrumbItem>Create coupon</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Title>Create Coupon</Title>

      <Card className='mt-6 border border-border bg-card text-card-foreground shadow-sm'>
        <CardHeader>
          <CardTitle>New coupon</CardTitle>
          <CardDescription>
            Coupons are limited to your own restaurant and must use uppercase letters and numbers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CouponForm
            submitLabel='Create Coupon'
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </section>
  );
};

export default CreateCouponPage;
