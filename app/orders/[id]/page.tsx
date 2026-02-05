'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import useProfile from '@/contexts/UseProfile';
import Link from 'next/link';
import OrderInfoCard from './OrderInfoCard';
import CustomerInfoCard from './CustomerInfoCard';
import OrderItemsCard from './OrderItemsCard';
import type { OrderMapHandle } from '@/components/shared/OrderMap';
import dynamic from 'next/dynamic';

// Dynamic import to prevent SSR issues with Leaflet
const OrderMap = dynamic(() => import('@/components/shared/OrderMap'), {
  ssr: false,
  loading: () => (
    <div className='border rounded-lg p-4 h-[400px] flex items-center justify-center bg-slate-50 dark:bg-slate-900'>
      <p className='text-muted-foreground'>Loading map...</p>
    </div>
  ),
});
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  cartProducts: CartProduct[];
  total: number;
  paymentStatus: boolean;
  orderStatus: 'placed' | 'processing' | 'ready' | 'transportation' | 'completed';
  courierId?: { _id: string; name: string; email: string; image?: string };
  createdAt: string;
  updatedAt: string;
  stripeSessionId?: string;
  taxPercentage?: number;
  deliveryFee?: number;
  loyaltyDiscount?: number;
  loyaltyDiscountPercentage?: number;
  loyaltyTier?: string;
  restaurantId?: string;
};

type CourierType = {
  _id: string;
  name: string;
  email: string;
  image?: string;
  availability: boolean;
  takenOrder?: string;
  role: string;
};

const OrderDetailPage = () => {
  const [order, setOrder] = useState<OrderDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'placed' | 'processing' | 'ready'>('placed');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [couriers, setCouriers] = useState<CourierType[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<string>('');
  const [assigningCourier, setAssigningCourier] = useState(false);
  const [showCourierSelect, setShowCourierSelect] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const mapRef = useRef<OrderMapHandle>(null);
  const { data: profileData, loading: profileLoading } = useProfile();
  const params = useParams();
  const orderId = params?.id as string;

  useEffect(() => {
    if (profileLoading || profileData?.role !== 'admin')
      return;

    const fetchOrder = async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }
        const res = await fetch(`/api/orders?id=${orderId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch order');
        }
        const json = await res.json();
        setOrder(json.order);
        setSelectedStatus(
          (json.order.orderStatus === 'completed' || json.order.orderStatus === 'transportation'
            ? 'ready'
            : json.order.orderStatus) || 'placed'
        );
        setStatusError('');
      } catch (err) {
        console.error('Failed to load order', err);
        setError('Failed to load order details');
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    };

    if (orderId) {
      // Fetch immediately on mount with loading indicator
      fetchOrder(true);

      // Poll for order updates every 10 seconds without loading indicator
      const interval = setInterval(() => {
        fetchOrder(false);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [orderId, profileData?.role, profileLoading]);

  // Fetch available couriers when order status is ready (for courier assignment)
  useEffect(() => {
    if (order?.orderStatus === 'ready') {
      const fetchCouriers = async () => {
        try {
          const res = await fetch('/api/my-delivery?availableOnly=true');
          if (!res.ok) throw new Error('Failed to fetch couriers');
          const data = await res.json();
          setCouriers(data.couriers);
        } catch (err) {
          console.error('Failed to fetch couriers', err);
        }
      };

      // Fetch immediately on mount
      fetchCouriers();

      // Poll for courier availability updates every 5 seconds
      const interval = setInterval(() => {
        fetchCouriers();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [order?.orderStatus]);

  const handleStatusUpdate = async () => {
    if (!order) return;

    if (!order.paymentStatus) {
      setStatusError('Payment must be completed before updating order status.');
      return;
    }

    setStatusUpdating(true);
    setStatusError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order._id, orderStatus: selectedStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusError(data.error || 'Failed to update order status');
        return;
      }

      // Update local order state immediately so UI reflects change
      setOrder((prevOrder) =>
        prevOrder ? { ...prevOrder, orderStatus: data.order.orderStatus } : data.order
      );
      setSelectedStatus(data.order.orderStatus);
      toast.success('Order status updated successfully', {
        style: {
          background: '#22c55e',
          color: 'white',
        },
      });
    } catch (err) {
      console.error(err);
      setStatusError('Failed to update order status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAssignCourier = async () => {
    if (!order || !selectedCourier) return;

    // Check if selected courier is still available
    const selectedCourierData = couriers.find((c) => c._id === selectedCourier);
    if (!selectedCourierData || !selectedCourierData.availability) {
      toast.error('Selected courier is no longer available. Please choose another courier.', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
      // Refresh courier list
      try {
        const res = await fetch('/api/my-delivery?availableOnly=true');
        if (res.ok) {
          const data = await res.json();
          setCouriers(data.couriers);
        }
      } catch (err) {
        console.error('Failed to refresh couriers', err);
      }
      return;
    }

    try {
      setAssigningCourier(true);
      const res = await fetch('/api/my-delivery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courierId: selectedCourier, orderId: order._id }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to assign courier', {
          style: {
            background: '#ef4444',
            color: 'white',
          },
        });
        return;
      }

      // Update order with courier info and transportation status
      const updatedOrder = {
        ...order,
        courierId: data.courier,
        orderStatus: 'transportation' as const,
      };
      setOrder(updatedOrder);
      setShowCourierSelect(false);
      setSelectedCourier('');
      setShowConfirmModal(false);
      toast.success('Courier assigned successfully - Order is now in transportation', {
        style: {
          background: '#22c55e',
          color: 'white',
        },
      });

      // Trigger map refresh to fetch the newly assigned courier's location
      if (mapRef.current) {
        await mapRef.current.refetchCourierLocation();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to assign courier', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
    } finally {
      setAssigningCourier(false);
    }
  };

  const handleConfirmAssignment = () => {
    setShowConfirmModal(true);
  };

  if (profileLoading || (loading && !order)) {
    return (
      <section className='mt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10'>
        <Breadcrumb className='mb-6'>
          <BreadcrumbList>
            <BreadcrumbItem>
              <Skeleton className='h-4 w-16' />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Skeleton className='h-4 w-24' />
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className='space-y-6'>
          {/* Order Information and Order Items - Side by side on large screens */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <Skeleton className='h-6 w-full max-w-xs' />
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {[...Array(4)].map((_, idx) => (
                    <div key={idx}>
                      <Skeleton className='h-4 w-40 mb-2' />
                      <Skeleton className='h-6 w-full' />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className='h-6 w-full max-w-xs' />
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    {[...Array(3)].map((_, idx) => (
                      <Skeleton key={idx} className='h-12 w-full' />
                    ))}
                  </div>
                  <div className='border-t pt-4 space-y-2'>
                    <div className='flex justify-between'>
                      <Skeleton className='h-5 w-20' />
                      <Skeleton className='h-5 w-16' />
                    </div>
                    <div className='flex justify-between border-t pt-2'>
                      <Skeleton className='h-6 w-16' />
                      <Skeleton className='h-6 w-20' />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Information and Status Update - Side by side on large screens */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <Skeleton className='h-6 w-full max-w-xs' />
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {[...Array(6)].map((_, idx) => (
                    <div key={idx}>
                      <Skeleton className='h-4 w-40 mb-2' />
                      <Skeleton className='h-6 w-full' />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className='h-6 w-full max-w-xs' />
                <Skeleton className='h-4 w-full max-w-sm mt-2' />
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-10 w-full' />
                </div>
                <Skeleton className='h-10 w-full' />
              </CardContent>
            </Card>
          </div>

          {/* Order Transportation Status */}
          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-full max-w-xs' />
              <Skeleton className='h-4 w-full max-w-md mt-2' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-32 w-full rounded-lg' />
            </CardContent>
          </Card>

          {/* Delivery Tracking Map */}
          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-full max-w-xs' />
              <Skeleton className='h-4 w-full max-w-sm mt-2' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-[400px] w-full rounded-lg' />
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (!profileData?.role || profileData.role !== 'admin')
    return 'Not an admin';

  if (error) return <div className='mt-8 text-red-600'>{error}</div>;

  if (!order) return <div className='mt-8'>Order not found</div>;

  return (
    <section className='mt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10'>
      <Breadcrumb className='mb-6'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href='/orders'>Orders</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Order Details</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className='space-y-6'>
        {/* Order Information and Order Items - Side by side on large screens */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <OrderInfoCard
            orderId={order._id}
            paymentStatus={order.paymentStatus}
            orderStatus={order.orderStatus}
            createdAt={order.createdAt}
            updatedAt={order.updatedAt}
            stripeSessionId={order.stripeSessionId}
            deliveryFee={order.deliveryFee}
            taxPercentage={order.taxPercentage}
          />

          <OrderItemsCard
            cartProducts={order.cartProducts}
            total={order.total}
            taxPercentage={order.taxPercentage}
            deliveryFee={order.deliveryFee}
            loyaltyDiscount={order.loyaltyDiscount}
            loyaltyDiscountPercentage={order.loyaltyDiscountPercentage}
            loyaltyTier={order.loyaltyTier}
          />
        </div>

        {/* Customer Information and Status Update - Side by side on large screens */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <CustomerInfoCard
            email={order.email}
            phone={order.phone}
            streetAddress={order.streetAddress}
            postalCode={order.postalCode}
            city={order.city}
            country={order.country}
          />

          <Card>
            <CardHeader>
              <CardTitle>Update Order Status</CardTitle>
              <CardDescription>
                {order.orderStatus === 'completed'
                  ? 'Order delivered successfully. You are not able to update order delivery status.'
                  : order.orderStatus === 'transportation'
                    ? 'Order is being delivered. Status cannot be changed.'
                    : order.orderStatus === 'ready'
                      ? 'Order is ready. Please assign a courier to start delivery.'
                      : 'Move the order forward through stages: placed → processing → ready.'}
              </CardDescription>
            </CardHeader>
            <CardContent className='flex flex-col h-full'>
              <div className='space-y-2 flex-1'>
                <p className='text-sm text-muted-foreground'>Order Status</p>
                <Select
                  value={selectedStatus}
                  onValueChange={(value) => setSelectedStatus(value as typeof selectedStatus)}
                  disabled={
                    !order.paymentStatus ||
                    statusUpdating ||
                    order.orderStatus === 'ready' ||
                    order.orderStatus === 'transportation' ||
                    order.orderStatus === 'completed'
                  }
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='placed' disabled={order.orderStatus !== 'placed'}>
                      placed
                    </SelectItem>
                    <SelectItem value='processing' disabled={order.orderStatus === 'ready'}>
                      processing
                    </SelectItem>
                    <SelectItem value='ready' disabled={order.orderStatus === 'placed'}>
                      ready
                    </SelectItem>
                  </SelectContent>
                </Select>
                {!order.paymentStatus && (
                  <p className='text-xs text-amber-600'>Payment required before changing status.</p>
                )}
                {order.orderStatus === 'ready' && (
                  <p className='text-xs text-green-600'>
                    Order is ready! Assign a courier below to start delivery.
                  </p>
                )}
                {statusError && <p className='text-sm text-red-600'>{statusError}</p>}
              </div>
              <Button
                onClick={handleStatusUpdate}
                disabled={
                  statusUpdating ||
                  !order.paymentStatus ||
                  order.orderStatus === 'ready' ||
                  order.orderStatus === 'transportation' ||
                  order.orderStatus === 'completed'
                }
                className='w-full mt-4'
              >
                {statusUpdating ? 'Updating...' : 'Save status'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {order.orderStatus === 'completed' && order.courierId && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>✅ Order Completed</CardTitle>
              <CardDescription>This order has been successfully delivered.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='border rounded-lg p-4 bg-green-50 dark:bg-green-950'>
                <p className='font-semibold text-green-900 dark:text-green-100 mb-2'>
                  Delivered By
                </p>
                <div className='flex items-center gap-3'>
                  {order.courierId.image && (
                    <Image
                      src={order.courierId.image}
                      alt={order.courierId.name}
                      width={40}
                      height={40}
                      className='w-10 h-10 rounded-full'
                    />
                  )}
                  <div>
                    <p className='font-medium'>{order.courierId.name}</p>
                    <p className='text-sm text-gray-600 dark:text-gray-300'>
                      {order.courierId.email}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {order.orderStatus === 'ready' && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>📦 Order Ready for Pickup</CardTitle>
              <CardDescription>
                The order is prepared and ready. Please assign an available courier to start
                delivery.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {!showCourierSelect ? (
                  <Button onClick={() => setShowCourierSelect(true)} className='w-full'>
                    Assign Courier
                  </Button>
                ) : (
                  <div className='space-y-3'>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>Select Available Courier</label>
                      {couriers.length === 0 ? (
                        <p className='text-sm text-amber-600'>
                          No available couriers at the moment. All couriers are currently delivering
                          orders.
                        </p>
                      ) : (
                        <>
                          <select
                            value={selectedCourier}
                            onChange={(e) => setSelectedCourier(e.target.value)}
                            className='w-full px-3 py-2 border border-input rounded-md bg-background'
                          >
                            <option value=''>Choose a courier...</option>
                            {couriers.map((courier) => (
                              <option
                                key={courier._id}
                                value={courier._id}
                                disabled={!!courier.takenOrder}
                              >
                                {courier.name} - {courier.email}
                                {courier.takenOrder ? ' (Currently delivering)' : ''}
                              </option>
                            ))}
                          </select>
                          <p className='text-xs text-muted-foreground'>
                            Only couriers who are not currently delivering an order are available
                            for assignment.
                          </p>
                        </>
                      )}
                    </div>
                    {selectedCourier && (
                      <div className='flex gap-2'>
                        <Button
                          onClick={handleConfirmAssignment}
                          disabled={assigningCourier || !selectedCourier}
                          className='flex-1'
                        >
                          Confirm Assignment
                        </Button>
                        <Button
                          variant='outline'
                          onClick={() => {
                            setShowCourierSelect(false);
                            setSelectedCourier('');
                          }}
                          className='flex-1'
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {order.orderStatus === 'transportation' && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                {order.courierId ? '📍 Order Being Transported' : '📦 Order Set to be Transported'}
              </CardTitle>
              <CardDescription>
                {order.courierId
                  ? 'This order is currently being transported to the customer.'
                  : 'This order is ready for transportation.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {order.courierId && (
                <div className='space-y-3'>
                  <div className='border rounded-lg p-4 bg-green-50 dark:bg-green-950'>
                    <p className='font-semibold text-green-900 dark:text-green-100 mb-2'>
                      Courier Assigned
                    </p>
                    <div className='flex items-center gap-3'>
                      {order.courierId.image && (
                        <Image
                          src={order.courierId.image}
                          alt={order.courierId.name}
                          width={40}
                          height={40}
                          className='w-10 h-10 rounded-full'
                        />
                      )}
                      <div>
                        <p className='font-medium'>{order.courierId.name}</p>
                        <p className='text-sm text-gray-600 dark:text-gray-300'>
                          {order.courierId.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <AlertDialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Courier Assignment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to assign this order to this courier? This action will notify
                the courier to start the delivery.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={assigningCourier}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleAssignCourier} disabled={assigningCourier}>
                {assigningCourier ? 'Assigning...' : 'Yes, Assign Courier'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Order Map - Show customer location for placed, processing, ready statuses */}
        {(order.orderStatus === 'placed' ||
          order.orderStatus === 'processing' ||
          order.orderStatus === 'ready') && (
          <Card>
            <CardHeader>
              <CardTitle>Delivery Location</CardTitle>
              <CardDescription>Customer&apos;s delivery address location.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='h-[400px] rounded-lg overflow-hidden'>
                <OrderMap
                  ref={mapRef}
                  address={order.streetAddress}
                  city={order.city}
                  postalCode={order.postalCode}
                  country={order.country}
                  customerEmail={order.email}
                  orderId={order._id}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Map - Full width, only shown when order is in transportation */}
        {order.orderStatus === 'transportation' && (
          <Card>
            <CardHeader>
              <CardTitle>Delivery Tracking</CardTitle>
              <CardDescription>Track the real-time location of the delivery.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='h-[400px] rounded-lg overflow-hidden'>
                <OrderMap
                  ref={mapRef}
                  address={order.streetAddress}
                  city={order.city}
                  postalCode={order.postalCode}
                  country={order.country}
                  customerEmail={order.email}
                  orderId={order._id}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
};

export default OrderDetailPage;
