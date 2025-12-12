'use client';

import { useEffect, useState } from 'react';
import UserTabs from '@/components/shared/UserTabs';
import useProfile from '@/contexts/UseProfile';
import Image from 'next/image';

type UserType = {
  _id: string;
  name: string;
  email: string;
  image?: string;
  city?: string;
  country?: string;
  phone?: string;
  postalCode?: string;
  streetAddress?: string;
  admin?: boolean;
};

const UsersPage = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const { data, loading } = useProfile();

  useEffect(() => {
    if (loading || !data?.admin) return;

    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const res = await fetch('/api/users');
        const usersList = await res.json();
        setUsers(usersList);
      } catch (error) {
        console.error('Failed to load users', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [loading, data?.admin]);

  if (loading) return 'Loading user info...';
  if (!data?.admin) return 'Not an admin';

  return (
    <section className='mt-8'>
      <UserTabs isAdmin={true} />

      <div className='mt-8'>
        {loadingUsers && <p>Loading users...</p>}

        {!loadingUsers && users.length === 0 && (
          <p>No users found.</p>
        )}

        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {users.map(user => (
            <article
              key={user._id}
              className='flex gap-4 p-4 rounded-xl border border-gray-200 bg-white shadow-sm'
            >
              <div className='w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shrink-0'>
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={`${user.name}'s avatar`}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className='text-gray-400 text-sm'>No image</span>
                )}
              </div>

              <div className='flex flex-col gap-1 text-sm'>
                <div className='flex items-center gap-2'>
                  <p className='font-semibold text-base'>{user.name}</p>
                  <span className='px-2 py-0.5 rounded-full text-xs border border-gray-300 bg-gray-50'>
                    {user.admin ? 'Admin' : 'User'}
                  </span>
                </div>
                <p className='text-gray-600'>{user.email}</p>
                <div className='text-gray-700'>
                  <p>{user.phone || 'No phone provided'}</p>
                  <p>{user.streetAddress || 'No street address'}</p>
                  <p>
                    {[user.city, user.postalCode].filter(Boolean).join(' ') || 'No city / postal code'}
                  </p>
                  <p>{user.country || 'No country'}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UsersPage;