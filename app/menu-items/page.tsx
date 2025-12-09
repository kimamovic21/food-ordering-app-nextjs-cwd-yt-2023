'use client';

import { useState } from 'react';
import UserTabs from '@/components/shared/UserTabs';
import useProfile from '@/contexts/UseProfile';

const MenuItemsPage = () => {
  const { data, loading } = useProfile();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');

  if (loading) {
    return 'Loading user info';
  };

  if (!data?.admin) {
    return 'Not an admin.';
  };

  const handleMenuItemImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
  }

  const handleMenuItems = async (e: React.FormEvent) => {
    e.preventDefault();

  };

  return (
    <section className='mt-8'>
      <UserTabs isAdmin={true} />

      <form className='mt-8 max-w-md mx-auto'>
        <div className='flex items-start gap-4'>
          <div>
            image
          </div>

          <div className='grow'>
            <label>Menu item name</label>
            <input type='text' />
            <label>Description</label>
            <input type='text' />
            <label>Base Price</label>
            <input type='text' />

            <button type='submit'>Save</button>
          </div>
        </div>
      </form>
    </section>
  );
};

export default MenuItemsPage;