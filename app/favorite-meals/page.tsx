'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import MenuItem from '@/app/menu/MenuItem';
import Title from '@/components/shared/Title';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { queryKeys } from '@/libs/queryKeys';
import FavoriteMealsLoading from './loading';
import type { FavoriteMealsResponse } from '@/types/favorites';

const fetchFavoriteMeals = async (): Promise<FavoriteMealsResponse> => {
  const response = await fetch('/api/favorites/menu-items', { cache: 'no-store' });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || 'Failed to fetch favorite meals');
  }

  return {
    items: Array.isArray(data?.items) ? data.items : [],
  };
};

const FavoriteMealsPage = () => {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const favoriteMealsQuery = useQuery({
    enabled: isAuthenticated,
    gcTime: 10 * 60 * 1000,
    queryFn: fetchFavoriteMeals,
    queryKey: queryKeys.favorites.menuItems(),
    staleTime: 60 * 1000,
  });

  const items = favoriteMealsQuery.data?.items || [];
  const isLoading = status === 'loading' || (isAuthenticated && favoriteMealsQuery.isLoading);
  const errorMessage =
    favoriteMealsQuery.error instanceof Error
      ? favoriteMealsQuery.error.message
      : favoriteMealsQuery.error
        ? 'Failed to load favorite meals'
        : null;

  if (status === 'unauthenticated') {
    return (
      <section className='mt-8'>
        <Title>Favorite Meals</Title>
        <Card className='mt-6'>
          <CardContent className='space-y-4 py-10 text-center'>
            <p className='text-muted-foreground'>Please login to see your favorite meals.</p>
            <Link href='/login'>
              <Button>Login</Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (isLoading) {
    return <FavoriteMealsLoading />;
  }

  return (
    <section className='mt-8'>
      <div className='mb-6'>
        <Title>Favorite Meals</Title>
        <p className='mt-2 text-sm text-muted-foreground'>
          Meals you saved for later are listed here.
        </p>
      </div>

      {errorMessage ? (
        <Card>
          <CardContent className='py-10 text-center text-red-500'>{errorMessage}</CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className='py-10 text-center text-muted-foreground'>
            You have no favorite meals yet.
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {items.map((item) => {
            const normalizedRestaurantId =
              typeof item.restaurantId === 'string'
                ? item.restaurantId
                : item.restaurantId?._id || '';

            return (
              <MenuItem
                key={item._id}
                item={{
                  ...item,
                  restaurantId: normalizedRestaurantId,
                }}
              />
            );
          })}
        </div>
      )}
    </section>
  );
};

export default FavoriteMealsPage;
