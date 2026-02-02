'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Mail, Globe, Users, Clock, DollarSign, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const OrderMap = dynamic(() => import('@/components/shared/OrderMap'), {
  ssr: false,
  loading: () => <div className='h-[400px] bg-muted animate-pulse rounded-lg' />,
});

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
  webAddress?: string;
  description: string;
  tax: number;
  courierFee: number;
  workingHours: WorkingHours[];
  blockedDates: BlockedDate[];
  totalEmployees: number;
  createdAt: string;
  updatedAt: string;
}

export default function RestaurantPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user || (session.user as any).role !== 'admin') {
      router.push('/');
      return;
    }

    fetchRestaurant();
  }, [status, session, router]);

  const fetchRestaurant = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/restaurant');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch restaurant');
      }

      setRestaurant(data.restaurant);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      toast.error('Failed to load restaurant data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!restaurant) return;

    if (
      !confirm('Are you sure you want to delete your restaurant? This action cannot be undone.')
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/restaurant?id=${restaurant._id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete restaurant');
      }

      toast.success('Restaurant deleted successfully');
      setRestaurant(null);
    } catch (error: any) {
      console.error('Error deleting restaurant:', error);
      toast.error(error.message || 'Failed to delete restaurant');
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
    return (
      <div className='container mx-auto py-8 px-4 w-sm md:w-2xl'>
        <Card className='w-full'>
          <CardHeader>
            <CardTitle>No Restaurant Found</CardTitle>
            <CardDescription>
              You haven&apos;t created a restaurant yet. Would you like to create one?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/restaurant/create')}>Create Restaurant</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getDayLabel = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  return (
    <div className='container mx-auto py-8 px-4 max-w-7xl'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold'>{restaurant.name}</h1>
        <div className='flex gap-2'>
          <Button
            onClick={() => router.push(`/restaurant/edit/${restaurant._id}`)}
            variant='outline'
          >
            <Edit className='h-4 w-4 mr-2' />
            Edit
          </Button>
          <Button onClick={handleDelete} variant='destructive'>
            <Trash2 className='h-4 w-4 mr-2' />
            Delete
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <p className='text-sm text-muted-foreground'>Description</p>
              <p>{restaurant.description}</p>
            </div>
            <div className='flex items-start gap-2'>
              <MapPin className='h-4 w-4 mt-1 text-muted-foreground' />
              <div>
                <p className='text-sm text-muted-foreground'>Address</p>
                <p>
                  {restaurant.street}, {restaurant.city}
                  <br />
                  {restaurant.postalCode}, {restaurant.country}
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Phone className='h-4 w-4 text-muted-foreground' />
              <div>
                <p className='text-sm text-muted-foreground'>Contact</p>
                <p>{restaurant.contact}</p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Mail className='h-4 w-4 text-muted-foreground' />
              <div>
                <p className='text-sm text-muted-foreground'>Email</p>
                <p>{restaurant.email}</p>
              </div>
            </div>
            {restaurant.webAddress && (
              <div className='flex items-center gap-2'>
                <Globe className='h-4 w-4 text-muted-foreground' />
                <div>
                  <p className='text-sm text-muted-foreground'>Website</p>
                  <a
                    href={restaurant.webAddress}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary hover:underline'
                  >
                    {restaurant.webAddress}
                  </a>
                </div>
              </div>
            )}
            <div className='flex items-center gap-2'>
              <Users className='h-4 w-4 text-muted-foreground' />
              <div>
                <p className='text-sm text-muted-foreground'>Total Employees</p>
                <p>{restaurant.totalEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='h-[400px] rounded-lg overflow-hidden'>
              <OrderMap
                address={restaurant.street}
                city={restaurant.city}
                postalCode={restaurant.postalCode}
                country={restaurant.country}
                shouldFetchCourier={false}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Fees */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Fees</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center gap-2'>
              <DollarSign className='h-4 w-4 text-muted-foreground' />
              <div className='flex-1'>
                <p className='text-sm text-muted-foreground'>Courier Fee</p>
                <p className='text-lg font-semibold'>${restaurant.courierFee.toFixed(2)}</p>
              </div>
            </div>
            <div>
              <p className='text-sm text-muted-foreground mb-2'>Tax Rate</p>
              <Badge variant='secondary'>{restaurant.tax}%</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Clock className='h-4 w-4 inline mr-2' />
              Working Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {restaurant.workingHours.map((hours, index) => (
                <div
                  key={index}
                  className='flex justify-between items-center py-2 border-b last:border-0'
                >
                  <span className='font-medium'>{getDayLabel(hours.day)}</span>
                  {hours.isClosed ? (
                    <Badge variant='destructive'>Closed</Badge>
                  ) : (
                    <span className='text-muted-foreground'>
                      {hours.openTime} - {hours.closeTime}
                    </span>
                  )}
                </div>
              ))}
            </div>
            {restaurant.blockedDates && restaurant.blockedDates.length > 0 && (
              <div className='mt-4 pt-4 border-t'>
                <p className='text-sm font-medium mb-2'>Blocked Dates</p>
                <div className='space-y-1'>
                  {restaurant.blockedDates.map((blocked, index) => (
                    <div key={index} className='text-sm'>
                      <span className='font-medium'>
                        {new Date(blocked.date).toLocaleDateString()}:
                      </span>{' '}
                      <span className='text-muted-foreground'>{blocked.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
