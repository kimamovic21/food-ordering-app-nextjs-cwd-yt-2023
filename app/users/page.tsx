'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Title from '@/components/shared/Title';
import useProfile from '@/contexts/UseProfile';
import UsersTable from './UsersTable';

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

          {!loadingUsers && users.length > 0 && <UsersTable users={users} />}
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