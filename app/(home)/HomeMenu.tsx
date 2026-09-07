'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import MenuItem from './MenuItem';
import { prefetchRestaurantOrderingStatuses } from '@/hooks/useRestaurantOrderingGate';
import type { MenuItemListItem } from '@/types/menu';

const MenuSkeleton = () => (
  <>
    <div className='text-center mb-4'>
      <Skeleton className='h-5 w-24 mx-auto mb-2' />
      <Skeleton className='h-10 w-32 mx-auto' />
    </div>
    <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
      {[...Array(6)].map((_, index) => (
        <Card key={index} className='p-0 overflow-hidden flex flex-col'>
          <div className='relative h-40 p-4 bg-muted'>
            <Skeleton className='mx-auto h-32 w-32' />
          </div>
          <div className='p-4 flex flex-col flex-1'>
            <Skeleton className='h-7 w-3/4 mb-4' />
            <div className='space-y-2 flex-1'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-5/6' />
            </div>
            <div className='flex gap-1 justify-center mt-4'>
              <Skeleton className='h-9 w-20' />
              <Skeleton className='h-9 w-20' />
              <Skeleton className='h-9 w-20' />
            </div>
            <Skeleton className='h-10 w-full mt-4' />
          </div>
        </Card>
      ))}
    </div>
  </>
);

const HomeMenu = () => {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<MenuItemListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await fetch('/api/menu-items');
        const data = await response.json();

        const pizzaItems = data.filter((item: MenuItemListItem) => {
          if (typeof item.category === 'string') {
            return item.category.toLowerCase() === 'pizzas';
          }
          return item.category?.name?.toLowerCase() === 'pizzas';
        });

        void prefetchRestaurantOrderingStatuses(
          queryClient,
          pizzaItems.map((item: MenuItemListItem) => item.restaurantId)
        );

        // Add 1 second delay before showing content
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setItems(pizzaItems);
      } catch (error) {
        console.error('Error fetching menu items:', error);
        sonnerToast.error('Failed to load menu items.');
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [queryClient]);

  return (
    <section className='my-16'>
      {loading ? (
        <MenuSkeleton />
      ) : items.length > 0 ? (
        <>
          <div className='text-center mb-4'>
            <h3 className='uppercase text-gray-500 dark:text-gray-400 font-semibold leading-3'>
              Check out
            </h3>
            <h2 className='text-primary font-bold text-4xl italic'>Menu</h2>
          </div>
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {items.map((item) => (
              <MenuItem key={item._id} item={item} />
            ))}
          </div>
        </>
      ) : (
        <div className='text-center py-8 text-gray-500 dark:text-gray-400'>
          No pizzas available at the moment...
        </div>
      )}
    </section>
  );
};

export default HomeMenu;
