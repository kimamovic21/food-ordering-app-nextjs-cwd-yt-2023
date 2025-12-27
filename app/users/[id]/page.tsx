'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Link from 'next/link';
import UserLoading from './loading';

type UserType = {
  _id: string;
  name: string;
  email: string;
  image?: string;
  emailVerified?: string | null;
  city?: string;
  country?: string;
  phone?: string;
  postalCode?: string;
  streetAddress?: string;
  updatedAt?: string;
  admin?: boolean;
};

const UserDetailsPage = () => {
  const params = useParams();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/users?id=${params.id}`);
        if (!res.ok) {
          throw new Error('Failed to fetch user');
        }
        const data = await res.json();
        await new Promise((resolve) => setTimeout(resolve, 500));
        setUser(data.user);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchUser();
    }
  }, [params.id]);

  if (loading) {
    return <UserLoading />;
  }

  if (error) {
    return (
      <div className='max-w-7xl mx-auto px-4 py-6'>
        <div className='text-red-500'>Error: {error}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='max-w-7xl mx-auto px-4 py-6'>
        <div className='text-gray-500'>User not found</div>
      </div>
    );
  }

  return (
    <div className='max-w-7xl mx-auto px-4 py-6'>
      <Breadcrumb className='mb-6'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href='/users' className='hover:underline'>
              Users
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>User Details</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* User Profile */}
          <div className='flex items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700'>
            <Avatar className='size-20'>
              <AvatarImage
                src={user.image || '/user-default-image.webp'}
                alt={`${user.name}'s avatar`}
                referrerPolicy='no-referrer'
              />
              <AvatarFallback className='text-2xl'>
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className='text-2xl font-bold'>{user.name}</h2>
              <Badge variant={user.admin ? 'default' : 'secondary'} className='mt-1'>
                {user.admin ? 'Admin' : 'User'}
              </Badge>
            </div>
          </div>

          {/* User Information Grid */}
          <div className='grid gap-4 md:grid-cols-2'>
            <div>
              <span className='text-sm font-medium text-gray-500 dark:text-gray-400'>Email:</span>
              <p className='text-base mt-1'>{user.email}</p>
            </div>

            <div>
              <span className='text-sm font-medium text-gray-500 dark:text-gray-400'>Phone:</span>
              <p className='text-base mt-1'>{user.phone || '-'}</p>
            </div>

            <div>
              <span className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                Street Address:
              </span>
              <p className='text-base mt-1'>{user.streetAddress || '-'}</p>
            </div>

            <div>
              <span className='text-sm font-medium text-gray-500 dark:text-gray-400'>City:</span>
              <p className='text-base mt-1'>{user.city || '-'}</p>
            </div>

            <div>
              <span className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                Postal Code:
              </span>
              <p className='text-base mt-1'>{user.postalCode || '-'}</p>
            </div>

            <div>
              <span className='text-sm font-medium text-gray-500 dark:text-gray-400'>Country:</span>
              <p className='text-base mt-1'>{user.country || '-'}</p>
            </div>

            <div className='md:col-span-2 pt-4 border-t border-gray-200 dark:border-gray-700'>
              <span className='text-sm font-medium text-gray-500 dark:text-gray-400'>User ID:</span>
              <p className='font-mono text-sm mt-1'>{user._id}</p>
            </div>

            {user.emailVerified !== undefined && (
              <div>
                <span className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                  Email Verified:
                </span>
                <p className='text-base mt-1'>{user.emailVerified ? 'Yes' : 'No'}</p>
              </div>
            )}

            {user.updatedAt && (
              <div>
                <span className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                  Last Updated:
                </span>
                <p className='text-base mt-1'>{new Date(user.updatedAt).toLocaleString()}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDetailsPage;
