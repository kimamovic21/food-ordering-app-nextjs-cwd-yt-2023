'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Title from '@/components/shared/Title';
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { data, loading } = useProfile();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (loading || !data?.admin) return;

    const currentPage = Math.max(1, parseInt(searchParams?.get('page') || '1', 10));
    setPage(currentPage);

    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const res = await fetch(`/api/users?page=${currentPage}`);
        const json = await res.json();
        setUsers(json.users || []);
        setTotalPages(json.totalPages || 1);
      } catch (error) {
        console.error('Failed to load users', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [loading, data?.admin, searchParams]);

  if (loading) return 'Loading user info...';
  if (!data?.admin) return 'Not an admin';

  return (
    <section className='mt-8 flex flex-col min-h-[calc(100vh-8rem)]'>
      <Title>Users</Title>

      <div className='mt-8 flex-1 flex flex-col'>
        <div className='flex-1'>
          {loadingUsers && <p>Loading users...</p>}

          {!loadingUsers && users.length === 0 && <p>No users found.</p>}

          {!loadingUsers && users.length > 0 && (
            <div className='rounded-xl border border-gray-200 bg-white shadow-sm'>
              <div className='overflow-x-auto'>
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
                    {users.map((user) => (
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
          )}
        </div>

        <div className='mt-auto pt-4 pb-4'>
          <div className='flex items-center justify-center gap-6 px-4 py-3 bg-white rounded-lg'>
            <button
              onClick={() => {
                const prev = Math.max(1, page - 1);
                router.push(`/users?page=${prev}`);
              }}
              disabled={page <= 1}
              className='px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition'
            >
              Previous
            </button>

            <div className='text-sm font-medium text-gray-700 whitespace-nowrap'>
              Page {page} of {totalPages}
            </div>

            <button
              onClick={() => {
                const next = Math.min(totalPages, page + 1);
                router.push(`/users?page=${next}`);
              }}
              disabled={page >= totalPages}
              className='px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition'
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const UsersPageWithSuspense = () => (
  <Suspense fallback={<p className='mt-8'>Loading page...</p>}>
    <UsersPage />
  </Suspense>
);

export default UsersPageWithSuspense;