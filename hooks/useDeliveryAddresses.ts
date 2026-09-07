'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/libs/queryKeys';
import type { DeliveryAddress, DeliveryAddressInput } from '@/types/user';

type DeliveryAddressResponse = {
  address?: DeliveryAddress;
  addresses: DeliveryAddress[];
};

const readErrorMessage = async (response: Response, fallback: string) => {
  const json = await response.json().catch(() => null);
  return json?.error || fallback;
};

const fetchDeliveryAddresses = async (): Promise<DeliveryAddress[]> => {
  const response = await fetch('/api/profile/delivery-addresses', { cache: 'no-store' });

  if (response.status === 401) {
    return [];
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to load delivery addresses.'));
  }

  const json = (await response.json()) as DeliveryAddressResponse;
  return Array.isArray(json.addresses) ? json.addresses : [];
};

const useDeliveryAddresses = (enabled: boolean) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.profile.deliveryAddresses(),
    queryFn: fetchDeliveryAddresses,
    enabled,
    staleTime: 60 * 1000,
  });

  const createAddress = useMutation({
    mutationFn: async (address: DeliveryAddressInput) => {
      const response = await fetch('/api/profile/delivery-addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Failed to save delivery address.'));
      }

      return (await response.json()) as DeliveryAddressResponse;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile.deliveryAddresses(), data.addresses);
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail() });
    },
  });

  const setDefaultAddress = useMutation({
    mutationFn: async (addressId: string) => {
      const response = await fetch('/api/profile/delivery-addresses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Failed to update delivery address.'));
      }

      return (await response.json()) as DeliveryAddressResponse;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile.deliveryAddresses(), data.addresses);
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail() });
    },
  });

  const deleteAddress = useMutation({
    mutationFn: async (addressId: string) => {
      const response = await fetch(
        `/api/profile/delivery-addresses?addressId=${encodeURIComponent(addressId)}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Failed to delete delivery address.'));
      }

      return (await response.json()) as DeliveryAddressResponse;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile.deliveryAddresses(), data.addresses);
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail() });
    },
  });

  return {
    addresses: query.data ?? [],
    isLoading: query.isLoading,
    createAddress,
    setDefaultAddress,
    deleteAddress,
  };
};

export default useDeliveryAddresses;
