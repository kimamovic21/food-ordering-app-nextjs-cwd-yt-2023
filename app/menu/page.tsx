'use client';

import { useEffect, useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import MenuItem from './MenuItem';

interface MenuItemType {
  _id: string;
  image?: string;
  name: string;
  description: string;
  category?: { _id: string; name: string } | string;
  priceSmall: number;
  priceMedium: number;
  priceLarge: number;
}

type CategoryConfig = {
  label: string;
  matchers: string[];
};

const categories: CategoryConfig[] = [
  { label: 'Pizza', matchers: ['pizza'] },
  { label: 'Pasta', matchers: ['pasta'] },
  { label: 'Desserts', matchers: ['desserts', 'deserts'] },
  { label: 'Soup', matchers: ['soup', 'soups'] },
  { label: 'Coffee', matchers: ['coffee', 'coffe'] },
];

const MenuPage = () => {
  const [items, setItems] = useState<MenuItemType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const response = await fetch('/api/menu-items');
        const data = await response.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching menu items:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  const groupedItems = useMemo(() => {
    const safeCategoryName = (item: MenuItemType) => {
      if (typeof item.category === 'string') return item.category.toLowerCase();
      return item.category?.name?.toLowerCase() || '';
    };

    return categories.map((category) => ({
      label: category.label,
      items: items.filter((item) => {
        const name = safeCategoryName(item);
        return category.matchers.some((match) => name === match);
      }),
    }));
  }, [items]);

  return (
    <main className='max-w-6xl mx-auto px-4 py-12'>
      {loading ? (
        <>
          {/* Header Skeleton */}
          <header className='mb-10 text-center'>
            <Skeleton className='h-10 w-32 mx-auto mb-3' />
            <Skeleton className='h-6 w-64 mx-auto' />
          </header>

          {/* Menu Items Skeleton */}
          <div className='space-y-10'>
            {categories.map((category) => (
              <section key={category.label}>
                {/* Category Title Skeleton */}
                <Skeleton className='h-8 w-24 mb-4' />

                {/* Menu Items Grid Skeleton */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {[...Array(3)].map((_, index) => (
                    <Card key={index} className='p-0 overflow-hidden flex flex-col'>
                      {/* Image Skeleton */}
                      <div className='relative h-40 p-4 bg-muted'>
                        <Skeleton className='mx-auto h-32 w-32 rounded-full' />
                      </div>

                      {/* Card Content Skeleton */}
                      <div className='p-4 flex flex-col flex-1'>
                        {/* Title Skeleton */}
                        <Skeleton className='h-7 w-3/4 mb-4' />

                        {/* Description Skeleton */}
                        <div className='space-y-2 flex-1'>
                          <Skeleton className='h-4 w-full' />
                          <Skeleton className='h-4 w-full' />
                          <Skeleton className='h-4 w-5/6' />
                        </div>

                        {/* Size Buttons Skeleton */}
                        <div className='flex gap-1 justify-center mt-4'>
                          <Skeleton className='h-9 w-20' />
                          <Skeleton className='h-9 w-20' />
                          <Skeleton className='h-9 w-20' />
                        </div>

                        {/* Add to Cart Button Skeleton */}
                        <Skeleton className='h-12 w-full mt-4' />
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      ) : (
        <>
          <header className='mb-10 text-center'>
            <h1 className='text-4xl font-bold mb-3'>Menu</h1>
            <p className='text-muted-foreground'>Browse your favorite food and drinks.</p>
          </header>

          <div className='space-y-10'>
            {groupedItems.map(({ label, items }) => (
              <section key={label}>
                <h2 className='text-2xl font-semibold mb-4'>{label}</h2>

                {items.length > 0 ? (
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {items.map((item) => (
                      <MenuItem key={item._id} item={item} />
                    ))}
                  </div>
                ) : (
                  <p className='text-muted-foreground'>No menu items found at the moment.</p>
                )}
              </section>
            ))}
          </div>
        </>
      )}
    </main>
  );
};

export default MenuPage;