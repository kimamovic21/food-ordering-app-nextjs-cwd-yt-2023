'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CourierEarningsPanel from '@/components/shared/CourierEarningsPanel';
import useProfile from '@/hooks/useProfile';

const CourierEarningsPage = () => {
  const router = useRouter();
  const { data: profileData, loading } = useProfile();

  useEffect(() => {
    if (!loading && profileData?.role !== 'courier') {
      router.replace('/');
    }
  }, [loading, profileData?.role, router]);

  if (loading || profileData?.role !== 'courier') {
    return null;
  }

  return (
    <CourierEarningsPanel
      endpoint='/api/courier-earnings'
      title='Courier Earnings'
      description='Track your completed delivery fees, ratings, and route performance.'
    />
  );
};

export default CourierEarningsPage;
