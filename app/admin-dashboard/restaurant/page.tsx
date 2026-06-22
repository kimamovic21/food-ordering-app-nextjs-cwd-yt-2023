'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { MapPin, Phone, Mail, Globe, Users, Clock, DollarSign, Edit, Trash2 } from 'lucide-react';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import RestaurantStatistics from './RestaurantStatistics';

const RestaurantLocation = dynamic(() => import('@/components/shared/RestaurantLocation'), {
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
  images: string[];
  createdAt: string;
  updatedAt: string;
}

const RestaurantPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      sonnerToast.error('Failed to load restaurant data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!restaurant) return;

    let deletingToastId: string | number | undefined;

    try {
      setIsDeleting(true);
      deletingToastId = sonnerToast.loading('Deleting restaurant please wait...');
      const response = await fetch(`/api/restaurant?id=${restaurant._id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete restaurant');
      }

      if (deletingToastId) {
        sonnerToast.success('Restaurant deleted successfully', { id: deletingToastId });
      } else {
        sonnerToast.success('Restaurant deleted successfully');
      }
      setRestaurant(null);
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      console.error('Error deleting restaurant:', error);
      if (deletingToastId) {
        sonnerToast.error(error.message || 'Failed to delete restaurant', { id: deletingToastId });
      } else {
        sonnerToast.error(error.message || 'Failed to delete restaurant');
      }
    } finally {
      if (deletingToastId) {
        sonnerToast.dismiss(deletingToastId);
      }
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className='container mx-auto py-8 px-4 max-w-7xl'>
        {/* Header Skeleton */}
        <div className='flex justify-between items-center mb-6'>
          <Skeleton className='h-10 w-64' />
          <div className='flex gap-2'>
            <Skeleton className='h-10 w-24' />
            <Skeleton className='h-10 w-24' />
          </div>
        </div>

        {/* Cards Grid Skeleton */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {/* Basic Information Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-40' />
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-3'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-5/6' />
              </div>
              <div className='space-y-3'>
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-4 w-full' />
              </div>
              <div className='space-y-3'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-4 w-full' />
              </div>
              <div className='space-y-3'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-4 w-3/4' />
              </div>
              <div className='space-y-3'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-4 w-16' />
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Fees Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-40' />
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='flex items-center gap-2'>
                <div className='w-4 h-4 bg-muted rounded animate-pulse' />
                <div className='flex-1'>
                  <Skeleton className='h-4 w-24 mb-2' />
                  <Skeleton className='h-6 w-20' />
                </div>
              </div>
              <div>
                <Skeleton className='h-4 w-24 mb-2' />
                <Skeleton className='h-7 w-16' />
              </div>
            </CardContent>
          </Card>

          {/* Working Hours Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-40' />
            </CardHeader>
            <CardContent className='space-y-3'>
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className='flex justify-between items-center py-2 border-b last:border-0'
                >
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-4 w-28' />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Location Map Card Skeleton */}
          <Card className='md:col-span-3'>
            <CardHeader>
              <Skeleton className='h-6 w-24' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-[400px] w-full rounded-lg' />
            </CardContent>
          </Card>
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
            <Button onClick={() => router.push('/admin-dashboard/restaurant/create')}>
              Create Restaurant
            </Button>
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
        <h1 className='text-3xl font-bold truncate mr-4'>{restaurant.name}</h1>
        <div className='flex gap-2 shrink-0'>
          <Button
            onClick={() => router.push(`/admin-dashboard/restaurant/edit/${restaurant._id}`)}
            variant='outline'
            className='min-w-[90px] max-w-[90px]'
          >
            <Edit className='h-4 w-4 mr-1.5' />
            Edit
          </Button>
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant='destructive'
                disabled={isDeleting}
                className='min-w-[90px] max-w-[90px] bg-red-700 hover:bg-red-800 text-white rounded-md!'
              >
                <Trash2 className='h-4 w-4 mr-1.5' />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent showCloseButton={false}>
              <DialogHeader>
                <DialogTitle>Delete Restaurant</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your restaurant and all
                  related data.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  type='button'
                  variant='destructive'
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Restaurant'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Restaurant Images */}
      {restaurant.images && restaurant.images.length > 0 && (
        <div className='mb-8'>
          <Card>
            <CardContent className='p-0'>
              {restaurant.images.length === 1 ? (
                // Single image display
                <div className='relative w-full h-96 rounded-lg overflow-hidden'>
                  <Image
                    src={restaurant.images[0]}
                    alt={restaurant.name}
                    fill
                    className='object-cover'
                    priority
                  />
                </div>
              ) : (
                // Carousel for multiple images
                <Carousel className='w-full'>
                  <CarouselContent>
                    {restaurant.images.map((imageUrl, index) => (
                      <CarouselItem key={index}>
                        <div className='relative w-full h-96 rounded-lg overflow-hidden'>
                          <Image
                            src={imageUrl}
                            alt={`${restaurant.name} - Image ${index + 1}`}
                            fill
                            className='object-cover'
                            priority={index === 0}
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <div className='absolute top-1/2 -translate-y-1/2 left-4 z-10'>
                    <CarouselPrevious variant='default' className='static translate-y-0 h-8 w-8' />
                  </div>
                  <div className='absolute top-1/2 -translate-y-1/2 right-4 z-10'>
                    <CarouselNext variant='default' className='static translate-y-0 h-8 w-8' />
                  </div>
                </Carousel>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
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

        {/* Location Map */}
        <Card className='md:col-span-3'>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='h-[400px] rounded-lg overflow-hidden'>
              <RestaurantLocation
                name={restaurant.name}
                address={`${restaurant.street}, ${restaurant.city} ${restaurant.postalCode}, ${restaurant.country}`}
                latitude={restaurant.latitude}
                longitude={restaurant.longitude}
              />
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card className='md:col-span-3'>
          <RestaurantStatistics />
        </Card>
      </div>
    </div>
  );
};

export default RestaurantPage;
