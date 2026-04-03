'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Title from '@/components/shared/Title';
import MenuItem from '@/app/menu/MenuItem';
import FavoriteMealsLoading from './loading';

interface FavoriteMenuItem {
  _id: string;
  image?: string;
  name: string;
  description: string;
  category?: { _id: string; name: string } | string;
  priceSmall: number | null;
  priceMedium: number | null;
  priceLarge: number | null;
  restaurantId: string | { _id: string; name?: string };
}

const FavoriteMealsPage = () => {
  const { status } = useSession();
  const [items, setItems] = useState<FavoriteMenuItem[]>([]);
  const [loading, setLoading] = useState(true);

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
        const response = await fetch('/api/favorites/menu-items', { cache: 'no-store' });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to fetch favorite meals');
        }

        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (error) {
        console.error('Failed to load favorite meals:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [status]);

  if (status === 'unauthenticated') {
    return (
      <section className='mt-8'>
        <Title>Favorite Meals</Title>
        <Card className='mt-6'>
          <CardContent className='py-10 text-center space-y-4'>
            <p className='text-muted-foreground'>Please login to see your favorite meals.</p>
            <Link href='/login'>
              <Button>Login</Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (loading) {
    return <FavoriteMealsLoading />;
  }

  return (
    <section className='mt-8'>
      <div className='mb-6'>
        <Title>Favorite Meals</Title>
        <p className='text-sm text-muted-foreground mt-2'>
          Meals you saved for later are listed here.
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className='py-10 text-center text-muted-foreground'>
            You have no favorite meals yet.
          </CardContent>
        </Card>
      ) : (
        <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6'>
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
