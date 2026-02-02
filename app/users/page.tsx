'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import { Card } from '@/components/ui/card';
import Title from '@/components/shared/Title';
import useProfile from '@/contexts/UseProfile';
import UsersTable from './UsersTable';
import UsersLoading from './loading';

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
    if (loading) return;

    if (data?.role !== 'admin') return;

    const currentPage = Math.max(1, parseInt(searchParams?.get('page') || '1', 10));
    setPage(currentPage);

    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const res = await fetch(`/api/users?page=${currentPage}`);
        const json = await res.json();

        // Add 500ms delay before showing users
        await new Promise((resolve) => setTimeout(resolve, 500));

        setUsers(json.users || []);
        setTotalPages(json.totalPages || 1);
      } catch (error) {
        console.error('Failed to load users', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [loading, data?.role, searchParams]);

  if (loading || loadingUsers) {
    return <UsersLoading />;
  }

  if (data?.role !== 'admin') {
    return (
      <div className='min-h-[calc(100vh-8rem)] flex items-center justify-center'>
        <p className='text-lg'>Not an admin</p>
      </div>
    );
  }

  return (
    <section className='mt-8 flex flex-col min-h-[calc(100vh-8rem)] max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10'>
      <Title>Users</Title>

      <div className='mt-8 flex-1 w-full flex flex-col'>
        <div className='flex-1'>
          {users.length === 0 && <p>No users found.</p>}

          {users.length > 0 && (
            <Card className='border border-border bg-card text-card-foreground shadow-sm'>
              <UsersTable users={users} />
            </Card>
          )}
        </div>

        <div className='mt-6 flex items-center justify-center gap-4 pb-4'>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={`/users?page=${Math.max(1, page - 1)}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const prev = Math.max(1, page - 1);
                    router.push(`/users?page=${prev}`);
                  }}
                  aria-disabled={page <= 1}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>

              <div className='flex items-center justify-center px-4 text-sm font-medium text-gray-700 dark:text-gray-200'>
                Page {page} of {totalPages}
              </div>

              <PaginationItem>
                <PaginationNext
                  href={`/users?page=${Math.min(totalPages, page + 1)}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const next = Math.min(totalPages, page + 1);
                    router.push(`/users?page=${next}`);
                  }}
                  aria-disabled={page >= totalPages}
                  className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
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
