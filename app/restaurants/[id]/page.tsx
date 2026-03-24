'use client';

import { useEffect, useState } from 'react';
import { Clock3, Globe, Mail, MapPin, Phone, Users } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import Title from '@/components/shared/Title';

const RestaurantLocation = dynamic(() => import('@/components/shared/RestaurantLocation'), {
  ssr: false,
  loading: () => <div className='h-[400px] bg-muted animate-pulse rounded-lg' />,
});
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WorkingHour {
  day: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface BlockedDate {
  date: string;
  reason: string;
}

interface RestaurantDetails {
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
  images: string[];
  tax: number;
  courierFee: number;
  totalEmployees: number;
  workingHours: WorkingHour[];
  blockedDates: BlockedDate[];
  isOpen: boolean;
}

const formatDay = (day: string) => day.charAt(0).toUpperCase() + day.slice(1);

const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const RestaurantDetailsPage = () => {
  const params = useParams();
  const id = params?.id as string;

  const [restaurant, setRestaurant] = useState<RestaurantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`/api/restaurants/${id}`, { signal: controller.signal });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch restaurant details');
        }

        setRestaurant(data.restaurant || null);
      } catch (fetchError) {
        if (!(fetchError instanceof DOMException && fetchError.name === 'AbortError')) {
          console.error('Error fetching restaurant details:', fetchError);
          setError('Failed to load restaurant details');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchRestaurant();

    return () => {
      controller.abort();
    };
  }, [id]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationLoading(false);
      setLocationError('Geolocation is not supported in your browser.');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationLoading(false);
      },
      (geoError) => {
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setLocationError('Location permission denied.');
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          setLocationError('Location is unavailable.');
        } else if (geoError.code === geoError.TIMEOUT) {
          setLocationError('Location request timed out.');
        } else {
          setLocationError('Unable to detect your location.');
        }

        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 60000 }
    );
  }, []);

  if (loading) {
    return (
      <section className='mt-8 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10'>
        <div className='h-8 w-72 bg-muted animate-pulse rounded-md mb-3' />
        <div className='h-5 w-52 bg-muted animate-pulse rounded-md mb-8' />

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2 space-y-6'>
            <div className='h-72 w-full bg-muted animate-pulse rounded-xl' />
            <div className='h-40 w-full bg-muted animate-pulse rounded-xl' />
          </div>
          <div className='space-y-6'>
            <div className='h-52 w-full bg-muted animate-pulse rounded-xl' />
            <div className='h-48 w-full bg-muted animate-pulse rounded-xl' />
          </div>
        </div>
      </section>
    );
  }

  if (error || !restaurant) {
    return (
      <section className='mt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10'>
        <Card>
          <CardContent className='py-10 text-center'>
            <p className='text-muted-foreground mb-5'>{error || 'Restaurant not found'}</p>
            <Link href='/restaurants'>
              <Button>Back to restaurants</Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    );
  }

  const hasImages = Array.isArray(restaurant.images) && restaurant.images.length > 0;
  const selectedImage = hasImages
    ? restaurant.images[Math.min(activeImage, restaurant.images.length - 1)]
    : null;
  const distanceKm =
    userLocation &&
    typeof restaurant.latitude === 'number' &&
    typeof restaurant.longitude === 'number'
      ? calculateDistanceKm(
          userLocation.latitude,
          userLocation.longitude,
          restaurant.latitude,
          restaurant.longitude
        )
      : null;

  return (
    <section className='mt-8 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10'>
      <Breadcrumb className='mb-4'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href='/restaurants'>Restaurants</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Restaurant details</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className='mb-6 flex flex-col gap-3'>
        <div className='flex items-center justify-between flex-wrap gap-3'>
          <Title>{restaurant.name}</Title>
          <Badge variant={restaurant.isOpen ? 'default' : 'secondary'}>
            {restaurant.isOpen ? 'Open now' : 'Currently closed'}
          </Badge>
        </div>
        <p className='text-sm text-muted-foreground flex items-center gap-1'>
          <MapPin className='h-4 w-4' />
          {restaurant.street}, {restaurant.city}, {restaurant.postalCode}, {restaurant.country}
        </p>
        <p className='text-sm text-muted-foreground'>
          {locationLoading
            ? 'Detecting your location to calculate distance...'
            : typeof distanceKm === 'number'
              ? `${distanceKm.toFixed(1)} km from your current location`
              : locationError || 'Distance unavailable without your location.'}
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 space-y-6'>
          <Card className='overflow-hidden'>
            <CardContent className='p-0'>
              <div className='relative h-72 w-full bg-muted'>
                {selectedImage ? (
                  <Image
                    src={selectedImage}
                    alt={restaurant.name}
                    fill
                    className='object-cover'
                    sizes='(max-width: 1024px) 100vw, 66vw'
                  />
                ) : (
                  <div className='h-full w-full flex items-center justify-center text-muted-foreground text-sm'>
                    No image available
                  </div>
                )}
              </div>

              {hasImages && restaurant.images.length > 1 && (
                <div className='grid grid-cols-4 gap-2 p-3'>
                  {restaurant.images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type='button'
                      className={`relative h-20 rounded-md overflow-hidden border ${
                        index === activeImage ? 'border-primary' : 'border-border'
                      }`}
                      onClick={() => setActiveImage(index)}
                    >
                      <Image
                        src={image}
                        alt={`${restaurant.name} ${index + 1}`}
                        fill
                        className='object-cover'
                        sizes='120px'
                      />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About Restaurant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm leading-6 text-foreground/90'>{restaurant.description}</p>
            </CardContent>
          </Card>
        </div>

        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 text-sm'>
              <p className='flex items-center gap-2'>
                <Phone className='h-4 w-4 text-muted-foreground' />
                {restaurant.contact}
              </p>
              <p className='flex items-center gap-2'>
                <Mail className='h-4 w-4 text-muted-foreground' />
                {restaurant.email}
              </p>
              {restaurant.webAddress && (
                <p className='flex items-center gap-2'>
                  <Globe className='h-4 w-4 text-muted-foreground' />
                  <a
                    href={restaurant.webAddress}
                    target='_blank'
                    rel='noreferrer noopener'
                    className='text-primary underline underline-offset-4'
                  >
                    Visit website
                  </a>
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Facts</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 text-sm'>
              <p className='flex items-center gap-2'>
                <Users className='h-4 w-4 text-muted-foreground' />
                Team size: {restaurant.totalEmployees}
              </p>
              <p>Tax: {restaurant.tax}%</p>
              <p>Courier fee: ${restaurant.courierFee}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Clock3 className='h-4 w-4' />
                Working Hours
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-2 text-sm'>
              {restaurant.workingHours.map((item) => (
                <div key={item.day} className='flex items-center justify-between'>
                  <span className='text-muted-foreground'>{formatDay(item.day)}</span>
                  <span>{item.isClosed ? 'Closed' : `${item.openTime} - ${item.closeTime}`}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className='mt-8'>
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            <div className='h-[400px]'>
              <RestaurantLocation
                latitude={restaurant.latitude}
                longitude={restaurant.longitude}
                name={restaurant.name}
                address={`${restaurant.street}, ${restaurant.city}, ${restaurant.postalCode}, ${restaurant.country}`}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='mt-8'>
        <Link href='/restaurants'>
          <Button variant='outline'>Back to restaurants</Button>
        </Link>
      </div>
    </section>
  );
};

export default RestaurantDetailsPage;
