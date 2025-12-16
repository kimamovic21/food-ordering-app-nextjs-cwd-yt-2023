'use client';

import { useEffect, useMemo, useState } from 'react';
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
      <header className='mb-10 text-center'>
        <h1 className='text-4xl font-bold mb-3'>Menu</h1>
        <p className='text-gray-600'>Browse your favorite food and drinks.</p>
      </header>

      {loading ? (
        <div className='text-center text-gray-600'>Loading menu items...</div>
      ) : (
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
                <p className='text-gray-500'>No menu items found at the moment.</p>
              )}
            </section>
          ))}
        </div>
      )}
    </main>
  );
};

export default MenuPage;