'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Title from '@/components/shared/Title';
import FavoriteToggleButton from '@/components/shared/FavoriteToggleButton';
import ShareActions from '@/components/shared/ShareActions';
import HeartRating from '@/components/shared/HeartRating';
import useFavorites from '@/hooks/useFavorites';

interface FavoriteRestaurant {
  _id: string;
  name: string;
  city: string;
  country: string;
  street: string;
  description: string;
  image: string | null;
  isOpen: boolean;
  averageRating: number;
  ratingCount: number;
}

const FavoriteRestaurantsPage = () => {
  const { status } = useSession();
  const [restaurants, setRestaurants] = useState<FavoriteRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: favorites, setRestaurantFavorite } = useFavorites();

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (status !== 'authenticated') {
      setLoading(false);
      return;
    }

    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/favorites/restaurants', { cache: 'no-store' });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to fetch favorite restaurants');
        }

        setRestaurants(Array.isArray(data.restaurants) ? data.restaurants : []);
      } catch (error) {
        console.error('Failed to load favorite restaurants:', error);
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [status]);

  if (status === 'unauthenticated') {
    return (
      <section className='mt-8'>
        <Title>Favorite Restaurants</Title>
        <Card className='mt-6'>
          <CardContent className='py-10 text-center space-y-4'>
            <p className='text-muted-foreground'>Please login to see your favorite restaurants.</p>
            <Link href='/login'>
              <Button>Login</Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className='mt-8'>
      <div className='mb-6'>
        {loading ? (
          <div className='space-y-3'>
            <Skeleton className='h-10 w-80 rounded-md' />
            <Skeleton className='h-5 w-full max-w-xl rounded-md' />
          </div>
        ) : (
          <>
            <Title>Favorite Restaurants</Title>
            <p className='text-sm text-muted-foreground mt-2'>
              Restaurants you marked as favorites are listed here.
            </p>
          </>
        )}
      </div>

      {loading ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className='h-full overflow-hidden border-border/80'>
              <Skeleton className='h-48 w-full rounded-none' />
              <CardHeader className='space-y-3'>
                <div className='flex items-start justify-between gap-3'>
                  <Skeleton className='h-6 w-2/3 rounded-md' />
                  <Skeleton className='h-8 w-8 rounded-full' />
                </div>
                <Skeleton className='h-6 w-16 rounded-full' />
                <Skeleton className='h-4 w-1/2 rounded-md' />
              </CardHeader>
              <CardContent className='space-y-3'>
                <Skeleton className='h-4 w-2/3 rounded-md' />
                <Skeleton className='h-4 w-full rounded-md' />
                <Skeleton className='h-4 w-5/6 rounded-md' />
                <div className='flex items-center gap-2 pt-1'>
                  <Skeleton className='h-8 w-8 rounded-full' />
                  <Skeleton className='h-8 w-8 rounded-full' />
                  <Skeleton className='h-8 w-8 rounded-full' />
                  <Skeleton className='h-8 w-8 rounded-full' />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <Card>
          <CardContent className='py-10 text-center text-muted-foreground'>
            You have no favorite restaurants yet.
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
          {restaurants.map((restaurant) => (
            <Card
              key={restaurant._id}
              className='h-full overflow-hidden border-border/80 hover:shadow-md transition-shadow'
            >
              <Link href={`/restaurants/${restaurant._id}`}>
                <div className='relative h-48 w-full bg-muted'>
                  {restaurant.image ? (
                    <Image
                      src={restaurant.image}
                      alt={restaurant.name}
                      fill
                      className='object-cover'
                      sizes='(max-width: 1024px) 100vw, 33vw'
                    />
                  ) : (
                    <div className='h-full w-full flex items-center justify-center text-muted-foreground text-sm'>
                      No image available
                    </div>
                  )}
                </div>
              </Link>
              <CardHeader className='space-y-2'>
                <div className='flex items-start justify-between gap-3'>
                  <CardTitle className='text-xl'>
                    <Link href={`/restaurants/${restaurant._id}`}>{restaurant.name}</Link>
                  </CardTitle>
                  <FavoriteToggleButton
                    type='restaurant'
                    targetId={restaurant._id}
                    isFavorite={favorites.favoriteRestaurantIds.includes(restaurant._id)}
                    onChanged={(nextIsFavorite) =>
                      setRestaurantFavorite(restaurant._id, nextIsFavorite)
                    }
                  />
                </div>
                <Badge variant={restaurant.isOpen ? 'default' : 'secondary'}>
                  {restaurant.isOpen ? 'Open' : 'Closed'}
                </Badge>
                <HeartRating
                  rating={restaurant.averageRating}
                  ratingCount={restaurant.ratingCount}
                />
                <p className='text-sm text-muted-foreground flex items-center gap-1'>
                  <MapPin className='h-4 w-4' />
                  {restaurant.city}, {restaurant.country}
                </p>
              </CardHeader>
              <CardContent className='space-y-3'>
                <p className='text-sm text-muted-foreground'>{restaurant.street}</p>
                <p className='text-sm text-foreground/90'>
                  {restaurant.description.length > 110
                    ? `${restaurant.description.slice(0, 110)}...`
                    : restaurant.description}
                </p>
                <ShareActions
                  url={`${typeof window !== 'undefined' ? window.location.origin : ''}/restaurants/${restaurant._id}`}
                  title={`Check out this restaurant: ${restaurant.name}`}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};

export default FavoriteRestaurantsPage;
