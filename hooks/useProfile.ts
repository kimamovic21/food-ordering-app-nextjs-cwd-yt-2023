'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { queryKeys } from '@/libs/queryKeys';
import type { ProfileData } from '@/types/user';

export type { ProfileData } from '@/types/user';

export const fetchProfile = async (): Promise<ProfileData | null> => {
  const response = await fetch('/api/profile', { cache: 'no-store' });
  const json = await response.json().catch(() => null);

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(json?.error || 'Failed to load profile');
  }

  return json ?? null;
};

const useProfile = () => {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isSessionLoading = status === 'loading';

  const query = useQuery({
    queryFn: fetchProfile,
    queryKey: queryKeys.profile.detail(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    data: isAuthenticated ? (query.data ?? null) : null,
    loading: isSessionLoading || (isAuthenticated && query.isLoading),
    error: query.error,
    refetch: query.refetch,
  };
};

export default useProfile;
