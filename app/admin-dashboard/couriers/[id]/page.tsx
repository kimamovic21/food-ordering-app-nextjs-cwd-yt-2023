'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CourierEarningsPanel from '@/components/shared/CourierEarningsPanel';
import useProfile from '@/hooks/useProfile';

const AdminCourierDetailsPage = () => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: profileData, loading } = useProfile();
  const isSuperAdmin =
    profileData?.role === 'admin' &&
    profileData?.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      router.replace('/');
    }
  }, [isSuperAdmin, loading, router]);

  if (loading || !isSuperAdmin) {
    return null;
  }

  return (
    <CourierEarningsPanel
      endpoint={`/api/courier-earnings?courierId=${encodeURIComponent(params.id)}`}
      title='Courier Details'
      description='Superadmin view of courier earnings, delivery volume, ratings, and reliability.'
    />
  );
};

export default AdminCourierDetailsPage;
