'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import RestaurantForm from '../RestaurantForm';

export default function CreateRestaurantPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasRestaurant, setHasRestaurant] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user || (session.user as any).role !== 'admin') {
      router.push('/');
      return;
    }

    checkExistingRestaurant();
  }, [status, session, router]);

  const checkExistingRestaurant = async () => {
    try {
      const response = await fetch('/api/restaurant');
      const data = await response.json();

      if (data.restaurant) {
        setHasRestaurant(true);
      }
    } catch (error) {
      console.error('Error checking restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='container mx-auto py-8 px-4'>
        {/* Header Skeleton */}
        <div className='mb-6 space-y-3'>
          <Skeleton className='h-9 w-96' />
          <Skeleton className='h-4 w-full max-w-md' />
        </div>

        {/* Form Skeleton */}
        <div className='space-y-6 max-w-6xl'>
          {/* Row 1: Two Cards - Basic & Contact Information */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Basic Information Card */}
            <div className='border rounded-lg p-6 space-y-4'>
              <div className='space-y-2 pb-4 border-b'>
                <Skeleton className='h-6 w-40' />
                <Skeleton className='h-3 w-56' />
              </div>
              <div className='space-y-4'>
                {/* Name field */}
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-10 w-full' />
                </div>
                {/* Description field */}
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-40' />
                  <Skeleton className='h-24 w-full' />
                </div>
              </div>
            </div>

            {/* Contact Information Card */}
            <div className='border rounded-lg p-6 space-y-4'>
              <div className='space-y-2 pb-4 border-b'>
                <Skeleton className='h-6 w-40' />
                <Skeleton className='h-3 w-48' />
              </div>
              <div className='space-y-4'>
                {/* Contact field */}
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-10 w-full' />
                </div>
                {/* Email field */}
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-10 w-full' />
                </div>
                {/* Website field */}
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-10 w-full' />
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Location Card */}
          <div className='border rounded-lg p-6 space-y-4'>
            <div className='space-y-2 pb-4 border-b'>
              <Skeleton className='h-6 w-32' />
              <Skeleton className='h-3 w-64' />
            </div>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Location Form - Left Side */}
              <div className='space-y-4'>
                {/* Street */}
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-28' />
                  <Skeleton className='h-10 w-full' />
                </div>
                {/* City & Postal Code */}
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Skeleton className='h-4 w-20' />
                    <Skeleton className='h-10 w-full' />
                  </div>
                  <div className='space-y-2'>
                    <Skeleton className='h-4 w-24' />
                    <Skeleton className='h-10 w-full' />
                  </div>
                </div>
                {/* Country */}
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-10 w-full' />
                </div>
                {/* Latitude & Longitude */}
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Skeleton className='h-4 w-20' />
                    <Skeleton className='h-10 w-full' />
                  </div>
                  <div className='space-y-2'>
                    <Skeleton className='h-4 w-24' />
                    <Skeleton className='h-10 w-full' />
                  </div>
                </div>
                {/* Get Current Location Button */}
                <Skeleton className='h-10 w-full' />
              </div>

              {/* Location Map - Right Side */}
              <div className='space-y-2'>
                <Skeleton className='h-4 w-28' />
                <Skeleton className='h-[400px] w-full rounded-lg' />
              </div>
            </div>
          </div>

          {/* Row 3: Pricing & Fees & Staff */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Pricing & Fees Card */}
            <div className='border rounded-lg p-6 space-y-4'>
              <div className='space-y-2 pb-4 border-b'>
                <Skeleton className='h-6 w-40' />
                <Skeleton className='h-3 w-48' />
              </div>
              <div className='space-y-4'>
                {/* Courier Fee */}
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-24' />
                  <div className='flex items-center gap-2 mt-2'>
                    <Skeleton className='h-10 w-10' />
                    <Skeleton className='h-10 flex-1' />
                    <Skeleton className='h-10 w-10' />
                  </div>
                </div>
                {/* Tax Rate */}
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-24' />
                  <div className='flex items-center gap-2 mt-2'>
                    <Skeleton className='h-10 w-10' />
                    <Skeleton className='h-10 flex-1' />
                    <Skeleton className='h-10 w-10' />
                  </div>
                </div>
              </div>
            </div>

            {/* Staff Card */}
            <div className='border rounded-lg p-6 space-y-4'>
              <div className='space-y-2 pb-4 border-b'>
                <Skeleton className='h-6 w-40' />
                <Skeleton className='h-3 w-56' />
              </div>
              <div className='space-y-4'>
                {/* Total Employees */}
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-32' />
                  <div className='flex items-center gap-2 mt-2'>
                    <Skeleton className='h-10 w-10' />
                    <Skeleton className='h-10 flex-1' />
                    <Skeleton className='h-10 w-10' />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Working Hours Card */}
          <div className='border rounded-lg p-6 space-y-4'>
            <div className='space-y-2 pb-4 border-b'>
              <Skeleton className='h-6 w-40' />
              <Skeleton className='h-3 w-56' />
            </div>
            <div className='space-y-3'>
              {[...Array(7)].map((_, i) => (
                <div key={i} className='flex items-center gap-4 py-2 border-b last:border-0'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-10 w-20' />
                  <Skeleton className='h-10 w-20' />
                  <Skeleton className='h-5 w-5 rounded' />
                </div>
              ))}
            </div>
          </div>

          {/* Row 5: Blocked Dates Card */}
          <div className='border rounded-lg p-6 space-y-4'>
            <div className='space-y-2 pb-4 border-b'>
              <Skeleton className='h-6 w-40' />
              <Skeleton className='h-3 w-56' />
            </div>
            <div className='space-y-4'>
              {/* Add Blocked Date Form */}
              <div className='flex gap-4 items-end p-4 border rounded-lg bg-muted/20'>
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-10 w-full' />
                </div>
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-10 w-full' />
                </div>
                <Skeleton className='h-10 w-16' />
              </div>
              {/* Blocked Dates List */}
              {[...Array(2)].map((_, i) => (
                <div key={i} className='flex justify-between items-center p-3 border rounded-lg'>
                  <div className='space-y-2 flex-1'>
                    <Skeleton className='h-4 w-32' />
                    <Skeleton className='h-3 w-40' />
                  </div>
                  <Skeleton className='h-10 w-10' />
                </div>
              ))}
            </div>
          </div>

          {/* Row 6: Submit Buttons */}
          <div className='flex gap-4 pt-4'>
            <Skeleton className='h-10 w-32' />
            <Skeleton className='h-10 w-32' />
          </div>
        </div>
      </div>
    );
  }

  if (hasRestaurant) {
    return (
      <div className='container mx-auto py-8 px-4'>
        <Card className='max-w-2xl mx-auto border-yellow-500'>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <AlertCircle className='h-6 w-6 text-yellow-500' />
              <CardTitle>Restaurant Already Exists</CardTitle>
            </div>
            <CardDescription>
              You already have a restaurant. You can only own one restaurant at a time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/admin-dashboard/restaurant')}>
              Go to My Restaurant
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8 px-4 max-w-4xl'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold'>Create Restaurant</h1>
        <p className='text-muted-foreground mt-2'>
          Fill in the details below to create your restaurant
        </p>
      </div>
      <RestaurantForm />
    </div>
  );
}
