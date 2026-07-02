'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import useProfile from '@/hooks/useProfile';
import Title from '@/components/shared/Title';
import { formatAppDate } from '@/libs/dateFormat';

type CourierType = {
  _id: string;
  name: string;
  email: string;
  image?: string;
  availability: boolean;
  takenOrder?: string;
  role: string;
  createdAt: string;
};

const CouriersPage = () => {
  const router = useRouter();
  const { data: profileData, loading: profileLoading } = useProfile();
  const [couriers, setCouriers] = useState<CourierType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isSuperAdmin =
    profileData?.role === 'admin' &&
    profileData?.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

  useEffect(() => {
    if (profileLoading) return;

    if (!isSuperAdmin) {
      router.push('/');
      return;
    }

    const fetchCouriers = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/my-delivery');
        if (!res.ok) {
          throw new Error('Failed to fetch couriers');
        }
        const data = await res.json();
        setCouriers(data.couriers);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCouriers();
  }, [isSuperAdmin, profileLoading, router]);

  if (profileLoading) {
    return (
      <div className='max-w-7xl mx-auto px-4 py-6'>
        <div className='space-y-6'>
          <div>
            <Skeleton className='h-10 w-96' />
            <Skeleton className='h-5 w-80 mt-2' />
          </div>
          <div className='space-y-4'>
            {[...Array(4)].map((_, idx) => (
              <Skeleton key={idx} className='h-24 w-full rounded-xl' />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='max-w-7xl mx-auto px-4 py-6'>
        <div className='space-y-6'>
          <div>
            <Skeleton className='h-10 w-96' />
            <Skeleton className='h-5 w-80 mt-2' />
          </div>
          <div className='space-y-4'>
            {[...Array(4)].map((_, idx) => (
              <Skeleton key={idx} className='h-24 w-full rounded-xl' />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className='w-full md:w-4xl lg:w-5xl max-w-5xl mx-auto px-4 py-6'>
      <div className='mb-6'>
        <Title>Couriers Management</Title>
        <p className='text-muted-foreground mt-2'>Total couriers: {couriers.length}</p>
      </div>

      {error && (
        <div className='bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6'>
          {error}
        </div>
      )}

      {couriers.length === 0 ? (
        <div className='flex justify-center'>
          <Card className='w-full max-w-2xl'>
            <CardContent className='py-16 text-center text-lg'>
              <p className='text-muted-foreground'>No couriers found</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className='space-y-4'>
          {couriers.map((courier) => (
            <Card key={courier._id} className='hover:shadow-lg transition-shadow'>
              <CardContent className='py-4'>
                <div className='flex items-center gap-4'>
                  <Avatar className='h-12 w-12'>
                    <AvatarImage src={courier.image} alt={courier.name} />
                    <AvatarFallback>
                      {courier.name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className='flex-1'>
                    <h3 className='text-lg font-semibold'>{courier.name}</h3>
                    <p className='text-sm text-muted-foreground'>{courier.email}</p>
                  </div>

                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium text-muted-foreground'>Availability:</span>
                    <Badge
                      variant={courier.availability ? 'default' : 'destructive'}
                      className={
                        courier.availability
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-red-600 hover:bg-red-700'
                      }
                    >
                      {courier.availability ? 'Online' : 'Offline'}
                    </Badge>
                  </div>

                  <div className='text-xs text-muted-foreground'>
                    Joined: {formatAppDate(courier.createdAt)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};

export default CouriersPage;
