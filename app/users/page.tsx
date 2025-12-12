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

        <div className='mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm'>
          <table className='min-w-full text-sm'>
            <thead className='bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600'>
              <tr>
                <th className='p-3'>Photo</th>
                <th className='p-3'>Name</th>
                <th className='p-3'>Email</th>
                <th className='p-3'>Phone</th>
                <th className='p-3'>Street address</th>
                <th className='p-3'>City / Postal</th>
                <th className='p-3'>Country</th>
                <th className='p-3'>Role</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {users.map(user => (
                <tr key={user._id} className='hover:bg-gray-50'>
                  <td className='p-3'>
                    <div className='w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center'>
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={`${user.name}'s avatar`}
                          width={48}
                          height={48}
                          className='w-12 h-12 rounded-full object-cover'
                          referrerPolicy='no-referrer'
                        />
                      ) : (
                        <span className='text-gray-400 text-xs'>No image</span>
                      )}
                    </div>
                  </td>
                  <td className='p-3 font-semibold text-gray-900'>{user.name}</td>
                  <td className='p-3 text-gray-700'>{user.email}</td>
                  <td className='p-3 text-gray-700'>{user.phone || '—'}</td>
                  <td className='p-3 text-gray-700'>{user.streetAddress || '—'}</td>
                  <td className='p-3 text-gray-700'>
                    {[user.city, user.postalCode].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className='p-3 text-gray-700'>{user.country || '—'}</td>
                  <td className='p-3'>
                    <span className='px-2 py-1 rounded-full text-xs border border-gray-300 bg-gray-50'>
                      {user.admin ? 'Admin' : 'User'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default UsersPage;