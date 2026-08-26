'use client';

import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import FavoriteToggleButton from '@/components/shared/FavoriteToggleButton';
import HeartRating from '@/components/shared/HeartRating';
import RestaurantQuickReorderButton from '@/components/shared/RestaurantQuickReorderButton';
import ShareActions from '@/components/shared/ShareActions';
import Title from '@/components/shared/Title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useFavorites from '@/hooks/useFavorites';
import { queryKeys } from '@/libs/queryKeys';
import FavoriteRestaurantsLoading from './loading';

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

type FavoriteRestaurantsResponse = {
  restaurants: FavoriteRestaurant[];
};

const fetchFavoriteRestaurants = async (): Promise<FavoriteRestaurantsResponse> => {
  const response = await fetch('/api/favorites/restaurants', { cache: 'no-store' });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || 'Failed to fetch favorite restaurants');
  }

  return {
    restaurants: Array.isArray(data?.restaurants) ? data.restaurants : [],
  };
};

const FavoriteRestaurantsPage = () => {
  const { status } = useSession();
  const { data: favorites, setRestaurantFavorite } = useFavorites();
  const isAuthenticated = status === 'authenticated';

  const favoriteRestaurantsQuery = useQuery({
    enabled: isAuthenticated,
    gcTime: 10 * 60 * 1000,
    queryFn: fetchFavoriteRestaurants,
    queryKey: queryKeys.favorites.restaurants(),
    staleTime: 60 * 1000,
  });

  const restaurants = favoriteRestaurantsQuery.data?.restaurants || [];
  const isLoading = status === 'loading' || (isAuthenticated && favoriteRestaurantsQuery.isLoading);
  const errorMessage =
    favoriteRestaurantsQuery.error instanceof Error
      ? favoriteRestaurantsQuery.error.message
      : favoriteRestaurantsQuery.error
        ? 'Failed to load favorite restaurants'
        : null;

  if (status === 'unauthenticated') {
    return (
      <section className='mt-8'>
        <Title>Favorite Restaurants</Title>
        <Card className='mt-6'>
          <CardContent className='space-y-4 py-10 text-center'>
            <p className='text-muted-foreground'>Please login to see your favorite restaurants.</p>
            <Link href='/login'>
              <Button>Login</Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (isLoading) {
    return <FavoriteRestaurantsLoading />;
  }

  return (
    <section className='mt-8'>
      <div className='mb-6'>
        <Title>Favorite Restaurants</Title>
        <p className='mt-2 text-sm text-muted-foreground'>
          Restaurants you marked as favorites are listed here.
        </p>
      </div>

      {errorMessage ? (
        <Card>
          <CardContent className='py-10 text-center text-red-500'>{errorMessage}</CardContent>
        </Card>
      ) : restaurants.length === 0 ? (
        <Card>
          <CardContent className='py-10 text-center text-muted-foreground'>
            You have no favorite restaurants yet.
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {restaurants.map((restaurant) => (
            <Card
              key={restaurant._id}
              className='h-full overflow-hidden border-border/80 transition-shadow hover:shadow-md'
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
                    <div className='flex h-full w-full items-center justify-center text-sm text-muted-foreground'>
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
                <p className='flex items-center gap-1 text-sm text-muted-foreground'>
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
                <RestaurantQuickReorderButton
                  restaurantId={restaurant._id}
                  restaurantName={restaurant.name}
                  className='w-full'
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
