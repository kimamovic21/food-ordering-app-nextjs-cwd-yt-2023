'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
import type { OrderMapHandle } from '@/components/shared/OrderMap';
import dynamic from 'next/dynamic';
import useProfile from '@/hooks/useProfile';
import Title from '@/components/shared/Title';
import AvailabilityToggle from './AvailabilityToggle';
import LocationShareButton from './LocationShareButton';
import DeliveryOrderCard from './DeliveryOrderCard';
import ManualLocationSimulator from './ManualLocationSimulator';
import MyDeliveryLoading from './loading';
import {
  getDevFailedDeliveryOffsetMinutes,
  getDevOrderTimeOffsetsFromStorage,
  hasDevOrderTimeOffsets,
} from '@/libs/devOrderTimeSimulator';

// Dynamic import to prevent SSR issues with Leaflet
const OrderMap = dynamic(() => import('@/components/shared/OrderMap'), {
  ssr: false,
  loading: () => (
    <div className='border rounded-lg p-4 h-[300px] flex items-center justify-center bg-slate-50 dark:bg-slate-900'>
      <p className='text-muted-foreground'>Loading map...</p>
    </div>
  ),
});

type CartProduct = {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
};

type OrderDetailsType = {
  _id: string;
  userId: string;
  email: string;
  phone: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  country: string;
  specialInstructions?: string;
  deliveryDistanceKm?: number | null;
  estimatedDeliveryMinutes?: number | null;
  cartProducts: CartProduct[];
  total: number;
  paymentStatus: boolean;
  orderStatus:
    'placed' | 'processing' | 'ready' | 'transportation' | 'delivered' | 'completed' | 'canceled';
  courierId?: { _id: string; name: string; email: string; image?: string };
  courierAssignmentStatus?: 'pending' | 'accepted' | 'declined' | null;
  restaurantHandedToCourierAt?: string | null;
  courierPickedUpAt?: string | null;
  transportationAt?: string | null;
  failedDeliveryRequestedAt?: string | null;
  failedDeliveryReason?: string | null;
  createdAt: string;
  updatedAt: string;
};

const CourierPage = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const { data: profileData, loading: profileLoading } = useProfile();
  const [orders, setOrders] = useState<OrderDetailsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [updatingAssignment, setUpdatingAssignment] = useState<string | null>(null);
  const [availability, setAvailability] = useState(false);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [locationShared, setLocationShared] = useState(false);
  const [locationPollingEnabled, setLocationPollingEnabled] = useState(true);
  const [devFailedDeliveryOffsets, setDevFailedDeliveryOffsets] = useState<Record<string, number>>(
    {}
  );
  const mapRefs = useRef<Map<string, OrderMapHandle>>(new Map());
  const isInitialLoadRef = useRef(true);

  const refreshDevFailedDeliveryOffsets = useCallback(
    async (nextOrders: OrderDetailsType[]) => {
      if (!isDevelopment) {
        return;
      }

      const entries = await Promise.all(
        nextOrders.map(async (order) => {
          const devOffsets = getDevOrderTimeOffsetsFromStorage(order._id);
          let offset = getDevFailedDeliveryOffsetMinutes(devOffsets);

          try {
            const response = await fetch(
              `/api/dev/order-time-simulator?orderId=${encodeURIComponent(order._id)}`,
              { cache: 'no-store' }
            );

            if (response.ok) {
              const json = await response.json();
              if (hasDevOrderTimeOffsets(json?.offsets || {})) {
                offset = getDevFailedDeliveryOffsetMinutes(json.offsets);
              }
            }
          } catch {
            // Simulator state is development-only. Keep local fallback.
          }

          return [order._id, offset] as const;
        })
      );

      setDevFailedDeliveryOffsets(Object.fromEntries(entries));
    },
    [isDevelopment]
  );

  useEffect(() => {
    if (profileLoading || profileData?.role !== 'courier') return;

    // Set initial availability from profile data
    if (profileData?.availability !== undefined) {
      setAvailability(profileData.availability);
    }

    const fetchOrders = async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }
        const res = await fetch('/api/my-delivery/orders');
        if (!res.ok) {
          throw new Error('Failed to fetch orders');
        }
        const data = await res.json();
        const fetchedOrders = data.orders || [];

        setOrders(fetchedOrders);
        await refreshDevFailedDeliveryOffsets(fetchedOrders);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        if (showLoading) {
          setLoading(false);
        }
        isInitialLoadRef.current = false;
      }
    };

    // Fetch immediately on mount with loading indicator
    fetchOrders(true);

    // Poll for new orders every 10 seconds without loading indicator
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [
    profileData?.role,
    profileLoading,
    profileData?.availability,
    refreshDevFailedDeliveryOffsets,
  ]);

  useEffect(() => {
    if (!isDevelopment) {
      return;
    }

    const refreshOffsets = () => {
      void refreshDevFailedDeliveryOffsets(orders);
    };
    const interval = window.setInterval(refreshOffsets, 2000);

    window.addEventListener('storage', refreshOffsets);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('storage', refreshOffsets);
    };
  }, [isDevelopment, orders, refreshDevFailedDeliveryOffsets]);

  const handleCompleteOrder = async (orderId: string, deliveryPin: string) => {
    try {
      setCompleting(orderId);
      const res = await fetch('/api/my-delivery/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, deliveryPin }),
      });

      const data = await res.json();

      if (!res.ok) {
        sonnerToast.error(data.error || 'Failed to complete order', {
          style: {
            background: '#ef4444',
            color: 'white',
          },
        });
        return;
      }

      setOrders(orders.filter((o) => o._id !== orderId));
      sonnerToast.success('Delivery handoff recorded. Awaiting confirmation.', {
        style: {
          background: '#22c55e',
          color: 'white',
        },
      });
    } catch (err) {
      console.error(err);
      sonnerToast.error('Failed to complete order', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
    } finally {
      setCompleting(null);
    }
  };

  const handleAssignmentAction = async (
    orderId: string,
    action: 'accept-assignment' | 'decline-assignment' | 'pick-up'
  ) => {
    try {
      setUpdatingAssignment(orderId);
      const res = await fetch('/api/my-delivery/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        sonnerToast.error(data.error || 'Failed to update assignment');
        return;
      }

      if (action === 'decline-assignment') {
        setOrders((current) => current.filter((order) => order._id !== orderId));
        sonnerToast.success('Assignment declined');
        return;
      }

      setOrders((current) =>
        current.map((order) => (order._id === orderId ? { ...order, ...data.order } : order))
      );
      sonnerToast.success(
        action === 'accept-assignment' ? 'Assignment accepted' : 'Order pickup recorded'
      );
    } catch (err) {
      console.error(err);
      sonnerToast.error('Failed to update assignment');
    } finally {
      setUpdatingAssignment(null);
    }
  };

  const handleFailedDeliveryRequest = async (orderId: string, reason: string) => {
    try {
      setUpdatingAssignment(orderId);
      const res = await fetch('/api/my-delivery/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          action: 'request-failed-delivery',
          reason,
          devFailedDeliveryOffsetMinutes: isDevelopment
            ? (devFailedDeliveryOffsets[orderId] ?? 0)
            : 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        sonnerToast.error(data.error || 'Failed to request failed delivery cancellation');
        return;
      }

      setOrders((current) =>
        current.map((order) => (order._id === orderId ? { ...order, ...data.order } : order))
      );
      sonnerToast.success('Failed delivery cancellation sent for admin verification');
    } catch (err) {
      console.error(err);
      sonnerToast.error('Failed to request failed delivery cancellation');
    } finally {
      setUpdatingAssignment(null);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      setTogglingAvailability(true);
      const res = await fetch('/api/my-delivery/availability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        sonnerToast.error(data.error || 'Failed to toggle availability', {
          style: {
            background: '#ef4444',
            color: 'white',
          },
        });
        return;
      }

      setAvailability(data.availability);
      sonnerToast.success(data.message, {
        style: {
          background: '#22c55e',
          color: 'white',
        },
      });
    } catch (err) {
      console.error(err);
      sonnerToast.error('Failed to toggle availability', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
    } finally {
      setTogglingAvailability(false);
    }
  };

  const handleShareLocation = async () => {
    if (!navigator.geolocation) {
      sonnerToast.error('Geolocation is not supported by your browser', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
      return;
    }

    try {
      setSharingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const res = await fetch('/api/my-delivery/location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ latitude, longitude }),
            });

            const data = await res.json();

            if (!res.ok) {
              sonnerToast.error(data.error || 'Failed to update location', {
                style: {
                  background: '#ef4444',
                  color: 'white',
                },
              });
              setSharingLocation(false);
              return;
            }

            setLocationShared(true);
            sonnerToast.success('Location shared successfully', {
              style: {
                background: '#22c55e',
                color: 'white',
              },
            });

            // Refetch location on all order maps immediately
            mapRefs.current.forEach((mapRef) => {
              mapRef.refetchCourierLocation().catch((err) => {
                console.error('Failed to refetch courier location:', err);
              });
            });

            // Reset the button state after 2 seconds
            setTimeout(() => {
              setLocationShared(false);
            }, 2000);
          } catch (err) {
            console.error(err);
            sonnerToast.error('Failed to update location', {
              style: {
                background: '#ef4444',
                color: 'white',
              },
            });
          } finally {
            setSharingLocation(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setSharingLocation(false);

          if (error.code === error.PERMISSION_DENIED) {
            sonnerToast.error('Location permission denied. Please enable location access.', {
              style: {
                background: '#ef4444',
                color: 'white',
              },
            });
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            sonnerToast.error('Location information is unavailable.', {
              style: {
                background: '#ef4444',
                color: 'white',
              },
            });
          } else if (error.code === error.TIMEOUT) {
            sonnerToast.error('Location request timed out.', {
              style: {
                background: '#ef4444',
                color: 'white',
              },
            });
          } else {
            sonnerToast.error('Failed to get your location', {
              style: {
                background: '#ef4444',
                color: 'white',
              },
            });
          }
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } catch (err) {
      console.error(err);
      sonnerToast.error('Failed to share location', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
      setSharingLocation(false);
    }
  };

  const handleManualLocationUpdate = async (latitude: number, longitude: number) => {
    try {
      setSharingLocation(true);

      const res = await fetch('/api/my-delivery/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude }),
      });

      const data = await res.json();

      if (!res.ok) {
        sonnerToast.error(data.error || 'Failed to update manual location', {
          style: {
            background: '#ef4444',
            color: 'white',
          },
        });
        return;
      }

      setLocationShared(true);
      sonnerToast.success('Manual location updated', {
        style: {
          background: '#22c55e',
          color: 'white',
        },
      });

      mapRefs.current.forEach((mapRef) => {
        mapRef.refetchCourierLocation().catch((err) => {
          console.error('Failed to refetch courier location:', err);
        });
      });

      setTimeout(() => {
        setLocationShared(false);
      }, 2000);

      if (isDevelopment && locationPollingEnabled) {
        setLocationPollingEnabled(false);
      }
    } catch (err) {
      console.error(err);
      sonnerToast.error('Failed to update manual location', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
    } finally {
      setSharingLocation(false);
    }
  };

  const handleToggleLocationPolling = () => {
    setLocationPollingEnabled((prev) => {
      const nextPollingEnabled = !prev;

      sonnerToast.success(nextPollingEnabled ? 'Enabled data polling' : 'Disabled data polling', {
        position: 'top-center',
        style: {
          background: '#22c55e',
          color: 'white',
        },
      });

      return nextPollingEnabled;
    });
  };

  if (profileLoading) {
    return <MyDeliveryLoading />;
  }

  if (profileData?.role !== 'courier') {
    return (
      <div className='max-w-7xl mx-auto px-4 py-6'>
        <div className='text-red-500'>Unauthorized: Only couriers can access this page</div>
      </div>
    );
  }

  if (loading) {
    return <MyDeliveryLoading />;
  }

  return (
    <div className='w-full lg:w-5xl max-w-5xl mx-auto px-4 py-6 pb-24 xl:pb-6'>
      <div className='mb-6'>
        <Title>My Delivery</Title>
        <p className='text-muted-foreground mt-2'>
          Active orders ready for delivery: {orders.length}
        </p>
      </div>

      <AvailabilityToggle
        availability={availability}
        togglingAvailability={togglingAvailability}
        onToggle={handleToggleAvailability}
      />

      <LocationShareButton
        locationShared={locationShared}
        sharingLocation={sharingLocation}
        availability={availability}
        onShare={handleShareLocation}
      />

      {error && (
        <div className='bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6'>
          {error}
        </div>
      )}

      {/* Show courier location map only when no active orders */}
      {orders.length === 0 ? (
        <>
          <Card className='mb-6'>
            <CardHeader>
              <CardTitle>Your Location</CardTitle>
              <CardDescription>Real-time location tracking for deliveries</CardDescription>
            </CardHeader>
            <CardContent>
              <OrderMap
                ref={(el) => {
                  if (el) mapRefs.current.set('courier-location', el);
                  else mapRefs.current.delete('courier-location');
                }}
                enableCourierPolling={locationPollingEnabled}
                heightClassName='h-[460px] lg:h-[540px]'
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className='py-12 text-center'>
              <p className='text-muted-foreground'>No active deliveries at the moment</p>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className='space-y-4'>
          {orders.map((order) => (
            <DeliveryOrderCard
              key={order._id}
              order={order}
              completing={completing}
              updatingAssignment={updatingAssignment}
              onAssignmentAction={handleAssignmentAction}
              onFailedDeliveryRequest={handleFailedDeliveryRequest}
              onComplete={handleCompleteOrder}
              mapRefs={mapRefs}
              enableCourierPolling={locationPollingEnabled}
              devFailedDeliveryOffsetMinutes={devFailedDeliveryOffsets[order._id] ?? 0}
            />
          ))}
        </div>
      )}

      {isDevelopment && (
        <ManualLocationSimulator
          availability={availability}
          pollingEnabled={locationPollingEnabled}
          updating={sharingLocation}
          onPollingToggle={handleToggleLocationPolling}
          onManualUpdate={handleManualLocationUpdate}
        />
      )}
    </div>
  );
};

export default CourierPage;
