'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import useProfile from '@/contexts/UseProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Package, Calendar, MapPin, DollarSign, Phone, CreditCard, Mail } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

type CartProduct = {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
};

type DeliveredOrder = {
  _id: string;
  userId: string;
  email: string;
  phone: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  country: string;
  cartProducts: CartProduct[];
  deliveryFee: number;
  loyaltyDiscount?: number;
  total: number;
  orderPaid: boolean;
  orderStatus: string;
  createdAt: string;
  updatedAt: string;
};

const DeliveryDetailsPage = () => {
  const params = useParams()!;
  const { data: profileData, loading: profileLoading } = useProfile();
  const [order, setOrder] = useState<DeliveredOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profileLoading || profileData?.role !== 'courier' || !params.id) return;

    const fetchDeliveryDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/my-deliveries/${params.id}`);
        if (!res.ok) {
          throw new Error('Failed to fetch delivery details');
        }
        const data = await res.json();
        setOrder(data.order);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryDetails();
  }, [params.id, profileData?.role, profileLoading]);

  if (profileLoading || loading) {
    return (
      <div className='container mx-auto px-4 py-8 max-w-7xl'>
        <Skeleton className='h-6 w-64 mb-6' />

        <div className='mb-6'>
          <Skeleton className='h-10 w-48 mb-2' />
          <Skeleton className='h-5 w-32' />
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className='h-6 w-40' />
              </CardHeader>
              <CardContent className='space-y-4'>
                <Skeleton className='h-16 w-full' />
                <Skeleton className='h-16 w-full' />
                <Skeleton className='h-16 w-full' />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className='mt-6'>
          <CardHeader>
            <Skeleton className='h-6 w-48' />
          </CardHeader>
          <CardContent className='space-y-4'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='flex items-center gap-4 p-4 border rounded-lg'>
                <Skeleton className='h-20 w-20 rounded-md' />
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-5 w-32' />
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-4 w-24' />
                </div>
                <div className='space-y-2'>
                  <Skeleton className='h-5 w-16' />
                  <Skeleton className='h-4 w-20' />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profileData?.role !== 'courier') {
    return (
      <div className='container mx-auto px-4 py-8 max-w-7xl'>
        <div className='text-red-500'>Unauthorized: Only couriers can access this page</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className='container mx-auto px-4 py-8 max-w-7xl'>
        <Breadcrumb className='mb-6'>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href='/my-deliveries'>My Deliveries</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Delivery Details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className='bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg'>
          {error || 'Delivery not found'}
        </div>
      </div>
    );
  }

  const loyaltyDiscount = order.loyaltyDiscount ?? 0;
  const subtotal = order.total - (order.deliveryFee || 0) + loyaltyDiscount;

  return (
    <div className='container mx-auto px-4 py-8 max-w-7xl'>
      <Breadcrumb className='mb-6'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/my-deliveries'>My Deliveries</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Delivery Details</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className='mb-6'>
        <h1 className='text-3xl font-bold mb-2'>Delivery Details</h1>
        <p className='text-muted-foreground'>Order #{order._id.slice(-6).toUpperCase()}</p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Order Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center gap-2'>
              <p className='text-sm text-muted-foreground'>Current Status:</p>
              <Badge className='bg-green-600 hover:bg-green-700 capitalize'>
                {order.orderStatus}
              </Badge>
            </div>
            <div className='flex items-center gap-2'>
              <Calendar className='h-4 w-4 text-muted-foreground' />
              <div>
                <p className='text-sm text-muted-foreground'>Order Date</p>
                <p className='font-medium'>{new Date(order.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Calendar className='h-4 w-4 text-muted-foreground' />
              <div>
                <p className='text-sm text-muted-foreground'>Delivered Date</p>
                <p className='font-medium'>{new Date(order.updatedAt).toLocaleString()}</p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <DollarSign className='h-4 w-4 text-muted-foreground' />
              <div>
                <p className='text-sm text-muted-foreground'>Total Amount</p>
                <p className='font-medium text-lg'>${order.total.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information Card */}
        <Card className='flex flex-col'>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col flex-1 space-y-4'>
            <div className='flex items-center gap-2'>
              <CreditCard className='h-4 w-4 text-muted-foreground' />
              <div className='flex items-center gap-2'>
                <p className='text-sm text-muted-foreground'>Payment Status:</p>
                <Badge
                  className={
                    order.orderPaid
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }
                >
                  {order.orderPaid ? 'Paid' : 'Unpaid'}
                </Badge>
              </div>
            </div>
            <div className='space-y-2 flex-1'>
              <div className='flex justify-between'>
                <p className='text-sm text-muted-foreground'>Subtotal</p>
                <p className='font-medium'>${subtotal.toFixed(2)}</p>
              </div>
              <div className='flex justify-between'>
                <p className='text-sm text-muted-foreground'>Delivery Fee</p>
                <p className='font-medium'>${(order.deliveryFee || 0).toFixed(2)}</p>
              </div>
              {loyaltyDiscount > 0 && (
                <div className='flex justify-between'>
                  <p className='text-sm text-muted-foreground'>Loyalty Discount</p>
                  <p className='font-medium text-green-600'>-${loyaltyDiscount.toFixed(2)}</p>
                </div>
              )}
            </div>
            <div className='pt-4 border-t flex justify-between'>
              <p className='text-sm text-muted-foreground'>Total</p>
              <p className='font-bold text-lg'>${order.total.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-start gap-2'>
              <Mail className='h-4 w-4 mt-1 text-muted-foreground shrink-0' />
              <div className='flex-1 min-w-0'>
                <p className='text-sm text-muted-foreground'>Email</p>
                <p className='font-medium wrap-break-word'>{order.email}</p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Phone className='h-4 w-4 text-muted-foreground' />
              <div>
                <p className='text-sm text-muted-foreground'>Phone</p>
                <p className='font-medium'>{order.phone}</p>
              </div>
            </div>
            <div className='flex items-start gap-2'>
              <MapPin className='h-4 w-4 mt-1 text-muted-foreground shrink-0' />
              <div className='flex-1'>
                <p className='text-sm text-muted-foreground'>Delivery Address</p>
                <p className='font-medium'>{order.streetAddress}</p>
                <p className='font-medium text-muted-foreground text-sm'>
                  {order.postalCode} {order.city}
                </p>
                <p className='font-medium text-muted-foreground text-sm'>{order.country}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items Card */}
      <Card className='mt-6'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Package className='h-5 w-5' />
            Order Items ({order.cartProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {order.cartProducts.map((item, index) => (
              <div key={index} className='flex items-center gap-4 p-4 border rounded-lg'>
                <div className='flex-1'>
                  <h3 className='font-semibold'>{item.name}</h3>
                  <p className='text-sm text-muted-foreground'>Quantity: {item.quantity}</p>
                  {item.size && <p className='text-sm text-muted-foreground'>Size: {item.size}</p>}
                </div>
                <div className='text-right'>
                  <p className='font-semibold'>${(item.price * item.quantity).toFixed(2)}</p>
                  <p className='text-sm text-muted-foreground'>${item.price.toFixed(2)} each</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryDetailsPage;
