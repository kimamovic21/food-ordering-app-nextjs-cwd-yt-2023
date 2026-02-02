'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
        <div className='animate-pulse space-y-4'>
          <div className='h-8 bg-muted rounded w-1/4' />
          <div className='h-64 bg-muted rounded' />
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
            <Button onClick={() => router.push('/restaurant')}>Go to My Restaurant</Button>
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
