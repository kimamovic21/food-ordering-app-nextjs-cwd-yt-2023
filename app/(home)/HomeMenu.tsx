'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import SaladImage1 from '@/public/salad1.png';
import SaladImage2 from '@/public/salad2.png';
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

const HomeMenu = () => {
  const [items, setItems] = useState<MenuItemType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await fetch('/api/menu-items');
        const data = await response.json();

        const pizzaItems = data.filter((item: MenuItemType) => {
          if (typeof item.category === 'string') {
            return item.category.toLowerCase() === 'pizza';
          }
          return item.category?.name?.toLowerCase() === 'pizza';
        });

        setItems(pizzaItems);
      } catch (error) {
        console.error('Error fetching menu items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  return (
    <section className='my-16'>
      <div className='absolute left-0 right-0 w-full'>
        <div className='absolute left-0 -top-16 text-left -z-10'>
          <Image
            src={SaladImage1}
            width={109}
            height={189}
            alt={'salad 1'}
          />
        </div>

        <div className='absolute -top-24 right-0 -z-10'>
          <Image
            src={SaladImage2}
            width={107}
            height={195}
            alt={'salad 2'}
          />
        </div>
      </div>

      <div className='text-center mb-4'>
        <h3 className='uppercase text-gray-500 font-semibold leading-3'>
          Check out
        </h3>

        <h2 className='text-primary font-bold text-4xl italic'>
          Menu
        </h2>
      </div>

      {loading ? (
        <div className='text-center py-8'>Loading menu items...</div>
      ) : items.length > 0 ? (
        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {items.map((item) => (
            <MenuItem key={item._id} item={item} />
          ))}
        </div>
      ) : (
        <div className='text-center py-8 text-gray-500'>No pizzas available at the moment...</div>
      )}
    </section>
  );
};

export default HomeMenu;