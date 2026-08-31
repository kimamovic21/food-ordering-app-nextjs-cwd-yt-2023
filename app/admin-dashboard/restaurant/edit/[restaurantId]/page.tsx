'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import RestaurantForm from '../../RestaurantForm';
import type { RestaurantAdminDetails } from '@/types/restaurant';

const EditRestaurantPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const restaurantId = params.restaurantId as string;
  const [restaurant, setRestaurant] = useState<RestaurantAdminDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRestaurant = useCallback(async () => {
    try {
      const response = await fetch('/api/restaurant');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch restaurant');
      }

      if (!data.restaurant) {
        sonnerToast.error('Restaurant not found');
        router.push('/admin-dashboard/restaurant');
        return;
      }

      // Verify that the restaurant ID matches
      if (data.restaurant._id !== restaurantId) {
        sonnerToast.error('You can only edit your own restaurant');
        router.push('/admin-dashboard/restaurant');
        return;
      }

      setRestaurant(data.restaurant);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      sonnerToast.error('Failed to load restaurant data');
      router.push('/admin-dashboard/restaurant');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, router]);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user || (session.user as any).role !== 'admin') {
      router.push('/');
      return;
    }

    fetchRestaurant();
  }, [status, session, router, restaurantId, fetchRestaurant]);

  if (loading) {
    return (
      <div className='container mx-auto py-8 px-4'>
        {/* Breadcrumb Skeleton */}
        <div className='mb-6 space-y-2'>
          <div className='flex gap-2 items-center'>
            <Skeleton className='h-4 w-20' />
            <Skeleton className='h-4 w-1' />
            <Skeleton className='h-4 w-32' />
          </div>
        </div>

        {/* Header Skeleton */}
        <div className='mb-6 space-y-3'>
          <Skeleton className='h-9 w-96' />
          <Skeleton className='h-4 w-80' />
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

  if (!restaurant) {
    return null;
  }

  return (
    <div className='container mx-auto py-8 px-4'>
      <Breadcrumb className='mb-6'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/admin-dashboard/restaurant'>Restaurant</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit Restaurant</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold'>Edit Restaurant</h1>
        <p className='text-muted-foreground mt-2'>Update your restaurant information</p>
      </div>
      <RestaurantForm restaurant={restaurant} isEdit={true} />
    </div>
  );
};

export default EditRestaurantPage;
