'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Title from '@/components/shared/Title';
import useProfile from '@/contexts/UseProfile';
import MenuItems from './MenuItems';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb';

interface MenuItem {
  _id: string;
  image?: string;
  name: string;
  description: string;
  category?: { _id: string; name: string } | string;
  priceSmall: number;
  priceMedium: number;
  priceLarge: number;
}

const MenuItemsListPage = () => {
  const router = useRouter();
  const { data, loading } = useProfile();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const res = await fetch('/api/menu-items');
      const items = await res.json();
      setMenuItems(items);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items');
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/menu-items/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/menu-items?_id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Delete failed');

      toast.success('Menu item deleted');
      fetchMenuItems();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete menu item');
    }
  };

  if (loading) return 'Loading user info...';
  if (!data?.admin) return 'Not an admin.';

  return (
    <section className='mt-8'>
      <Breadcrumb className='mb-4'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/menu-items'>Menu Items</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className='flex items-center justify-between mb-6'>
        <Title>Menu Items</Title>
        <Button onClick={() => router.push('/menu-items/new')}>Create New Item</Button>
      </div>

      <MenuItems menuItems={menuItems} onEdit={handleEdit} onDelete={handleDelete} />
    </section>
  );
};

export default MenuItemsListPage;
