'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import RestaurantForm from '../../RestaurantForm';
import { toast } from 'sonner';

interface TaxRule {
  name: string;
  percentage: number;
}

interface WorkingHours {
  day: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface BlockedDate {
  date: string;
  reason: string;
}

interface Restaurant {
  _id: string;
  name: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  contact: string;
  email: string;
  webAddress: string;
  description: string;
  tax: number;
  courierFee: number;
  workingHours: WorkingHours[];
  blockedDates: BlockedDate[];
  totalEmployees: number;
}

export default function EditRestaurantPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const restaurantId = params.restaurantId as string;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user || (session.user as any).role !== 'admin') {
      router.push('/');
      return;
    }

    fetchRestaurant();
  }, [status, session, router, restaurantId]);

  const fetchRestaurant = async () => {
    try {
      const response = await fetch('/api/restaurant');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch restaurant');
      }

      if (!data.restaurant) {
        toast.error('Restaurant not found');
        router.push('/restaurant');
        return;
      }

      // Verify that the restaurant ID matches
      if (data.restaurant._id !== restaurantId) {
        toast.error('You can only edit your own restaurant');
        router.push('/restaurant');
        return;
      }

      setRestaurant(data.restaurant);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      toast.error('Failed to load restaurant data');
      router.push('/restaurant');
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

  if (!restaurant) {
    return null;
  }

  return (
    <div className='container mx-auto py-8 px-4 max-w-4xl'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold'>Edit Restaurant</h1>
        <p className='text-muted-foreground mt-2'>Update your restaurant information</p>
      </div>
      <RestaurantForm restaurant={restaurant} isEdit={true} />
    </div>
  );
}
