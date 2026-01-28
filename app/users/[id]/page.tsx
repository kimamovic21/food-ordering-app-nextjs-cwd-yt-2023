'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import UserLoading from './loading';
import useProfile from '@/contexts/UseProfile';

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
  role?: string;
};

const UserLocationMap = dynamic(() => import('./UserLocationMap'), {
  ssr: false,
  loading: () => (
    <div className='h-80 rounded-lg border border-gray-200 bg-muted/40 dark:border-gray-800' />
  ),
});

const UserDetailsPage = () => {
  const params = useParams()!;
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [makingCourier, setMakingCourier] = useState(false);
  const [makingManager, setMakingManager] = useState(false);
  const [makingAdmin, setMakingAdmin] = useState(false);
  const { data: profileData, loading: profileLoading } = useProfile();

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

  const handleMakeCourier = async () => {
    if (!user) return;

    try {
      setMakingCourier(true);
      const res = await fetch('/api/users/make-courier', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to make courier', {
          style: {
            background: '#ef4444',
            color: 'white',
          },
        });
        return;
      }

      setUser({ ...user, role: 'courier' });
      toast.success('User has been promoted to courier', {
        style: {
          background: '#22c55e',
          color: 'white',
        },
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to make courier', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
    } finally {
      setMakingCourier(false);
    }
  };

  const handleRemoveCourier = async () => {
    if (!user) return;

    try {
      setMakingCourier(true);
      const res = await fetch('/api/users/remove-courier', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to remove courier', {
          style: {
            background: '#ef4444',
            color: 'white',
          },
        });
        return;
      }

      setUser({ ...user, role: 'user' });
      toast.success('User courier role has been removed', {
        style: {
          background: '#22c55e',
          color: 'white',
        },
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove courier', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
    } finally {
      setMakingCourier(false);
    }
  };

  const handleMakeManager = async () => {
    if (!user) return;

    try {
      setMakingManager(true);
      const res = await fetch('/api/users/make-manager', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to make manager', {
          style: {
            background: '#ef4444',
            color: 'white',
          },
        });
        return;
      }

      setUser({ ...user, role: 'manager' });
      toast.success('User has been promoted to manager', {
        style: {
          background: '#22c55e',
          color: 'white',
        },
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to make manager', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
    } finally {
      setMakingManager(false);
    }
  };

  const handleRemoveManager = async () => {
    if (!user) return;

    try {
      setMakingManager(true);
      const res = await fetch('/api/users/remove-manager', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to remove manager', {
          style: {
            background: '#ef4444',
            color: 'white',
          },
        });
        return;
      }

      setUser({ ...user, role: 'user' });
      toast.success('User manager role has been removed', {
        style: {
          background: '#22c55e',
          color: 'white',
        },
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove manager', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
    } finally {
      setMakingManager(false);
    }
  };

  const handleMakeAdmin = async () => {
    if (!user) return;

    try {
      setMakingAdmin(true);
      const res = await fetch('/api/users/make-admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to make admin', {
          style: {
            background: '#ef4444',
            color: 'white',
          },
        });
        return;
      }

      setUser({ ...user, role: 'admin' });
      toast.success('User has been promoted to admin', {
        style: {
          background: '#22c55e',
          color: 'white',
        },
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to make admin', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
    } finally {
      setMakingAdmin(false);
    }
  };

  const handleRemoveAdmin = async () => {
    if (!user) return;

    try {
      setMakingAdmin(true);
      const res = await fetch('/api/users/remove-admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to remove admin', {
          style: {
            background: '#ef4444',
            color: 'white',
          },
        });
        return;
      }

      setUser({ ...user, role: 'user' });
      toast.success('User admin role has been removed', {
        style: {
          background: '#22c55e',
          color: 'white',
        },
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove admin', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
    } finally {
      setMakingAdmin(false);
    }
  };

  if (loading || profileLoading) {
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

      <div className='flex flex-col gap-6'>
        <div className='max-w-4xl mx-auto w-full space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>User Details</CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
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
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className='mt-1'>
                    {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                  </Badge>
                </div>
              </div>

              <div className='grid gap-4 md:grid-cols-2'>
                <div className='md:col-span-2'>
                  <span className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                    Email:
                  </span>
                  <p className='text-base mt-1 break-all'>{user.email}</p>
                </div>

                <div>
                  <span className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                    Phone:
                  </span>
                  <p className='text-base mt-1'>{user.phone || '-'}</p>
                </div>

                <div>
                  <span className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                    Street Address:
                  </span>
                  <p className='text-base mt-1'>{user.streetAddress || '-'}</p>
                </div>

                <div>
                  <span className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                    City:
                  </span>
                  <p className='text-base mt-1'>{user.city || '-'}</p>
                </div>

                <div>
                  <span className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                    Country:
                  </span>
                  <p className='text-base mt-1'>{user.country || '-'}</p>
                </div>

                <div className='md:col-span-2 pt-4 border-t border-gray-200 dark:border-gray-700'>
                  <span className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                    User ID:
                  </span>
                  <p className='font-mono text-sm mt-1 break-all'>{user._id}</p>
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

              {profileData?.role === 'admin' &&
                user.role !== 'courier' &&
                user.role !== 'manager' &&
                user.role !== 'admin' && (
                  <div className='mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3'>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          disabled={makingCourier}
                          className='w-full bg-primary hover:bg-primary/90'
                        >
                          {makingCourier ? 'Making Courier...' : 'Make Courier'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Make Courier</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to make {user.name} a courier?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className='flex gap-3 justify-end'>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleMakeCourier}
                            className='bg-primary hover:bg-primary/90'
                          >
                            Confirm
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          disabled={makingManager}
                          className='w-full bg-primary hover:bg-primary/90'
                        >
                          {makingManager ? 'Making Manager...' : 'Make Manager'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Make Manager</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to make {user.name} a manager?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className='flex gap-3 justify-end'>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleMakeManager}
                            className='bg-primary hover:bg-primary/90'
                          >
                            Confirm
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>

                    {profileData?.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            disabled={makingAdmin}
                            className='w-full bg-primary hover:bg-primary/90'
                          >
                            {makingAdmin ? 'Making Admin...' : 'Make Admin'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Make Admin</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to make {user.name} an admin?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className='flex gap-3 justify-end'>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleMakeAdmin}
                              className='bg-primary hover:bg-primary/90'
                            >
                              Confirm
                            </AlertDialogAction>
                          </div>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                )}

              {profileData?.role === 'admin' && user.role === 'courier' && (
                <div className='mt-6 pt-6 border-t border-gray-200 dark:border-gray-700'>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button disabled={makingCourier} variant='destructive' className='w-full'>
                        {makingCourier ? 'Removing Courier...' : 'Remove Courier'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Courier</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove {user.name} from courier role?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className='flex gap-3 justify-end'>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleRemoveCourier}
                          className='bg-red-600 hover:bg-red-700'
                        >
                          Confirm
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              {profileData?.role === 'admin' && user.role === 'manager' && (
                <div className='mt-6 pt-6 border-t border-gray-200 dark:border-gray-700'>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button disabled={makingManager} variant='destructive' className='w-full'>
                        {makingManager ? 'Removing Manager...' : 'Remove Manager'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Manager</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove {user.name} from manager role?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className='flex gap-3 justify-end'>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleRemoveManager}
                          className='bg-red-600 hover:bg-red-700'
                        >
                          Confirm
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              {profileData?.role === 'admin' &&
                user.role === 'admin' &&
                profileData?.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL && (
                  <div className='mt-6 pt-6 border-t border-gray-200 dark:border-gray-700'>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button disabled={makingAdmin} variant='destructive' className='w-full'>
                          {makingAdmin ? 'Removing Admin...' : 'Remove Admin'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Admin</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {user.name} from admin role?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className='flex gap-3 justify-end'>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleRemoveAdmin}
                            className='bg-red-600 hover:bg-red-700'
                          >
                            Confirm
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className='min-h-80'>
              {user.streetAddress || user.city || user.country ? (
                <UserLocationMap
                  streetAddress={user.streetAddress}
                  city={user.city}
                  postalCode={user.postalCode}
                  country={user.country}
                  name={user.name}
                />
              ) : (
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Location data is unavailable.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsPage;
