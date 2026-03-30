import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import type { OrderMapHandle } from '@/components/shared/OrderMap';
import dynamic from 'next/dynamic';

const OrderMap = dynamic(() => import('@/components/shared/OrderMap'), { ssr: false });

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
};

interface DeliveryOrderCardProps {
  order: OrderDetailsType;
  completing: string | null;
  onComplete: (orderId: string) => void;
  mapRefs: React.MutableRefObject<Map<string, OrderMapHandle>>;
  enableCourierPolling?: boolean;
}

const DeliveryOrderCard: React.FC<DeliveryOrderCardProps> = ({
  order,
  completing,
  onComplete,
  mapRefs,
  enableCourierPolling = true,
}) => (
  <Card className='hover:shadow-lg transition-shadow'>
    <CardHeader>
      <div className='flex items-start justify-between'>
        <div>
          <CardTitle className='text-lg'>Order #{order._id.slice(-8).toUpperCase()}</CardTitle>
          <CardDescription>
            Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
            {new Date(order.createdAt).toLocaleTimeString()}
          </CardDescription>
        </div>
        <Badge
          variant='secondary'
          className='bg-amber-100 text-amber-800 hover:bg-amber-100 capitalize'
        >
          Transportation
        </Badge>
      </div>
    </CardHeader>
    <CardContent>
      <div className='space-y-4'>
        {/* Customer Info */}
        <div className='border rounded-lg p-4'>
          <h3 className='font-semibold text-foreground mb-3'>Customer Details</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
            <div>
              <span className='text-muted-foreground'>Email:</span>
              <p className='text-foreground'>{order.email}</p>
            </div>
            <div>
              <span className='text-muted-foreground'>Phone:</span>
              <p className='text-foreground'>{order.phone}</p>
            </div>
            <div>
              <span className='text-muted-foreground'>Address:</span>
              <p className='text-foreground'>
                {order.streetAddress}, {order.postalCode} {order.city}, {order.country}
              </p>
            </div>
          </div>
        </div>
        {/* Items */}
        <div className='border rounded-lg p-4'>
          <h3 className='font-semibold text-foreground mb-3'>Items</h3>
          <div className='space-y-2'>
            {order.cartProducts.map((product, idx) => (
              <div key={idx} className='flex justify-between items-center text-sm'>
                <div>
                  <p className='font-medium text-foreground'>{product.name}</p>
                  <p className='text-muted-foreground'>
                    Size: {product.size} x {product.quantity}
                  </p>
                </div>
                <p className='font-medium text-foreground'>${product.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className='border-t mt-4 pt-4 flex justify-between font-semibold'>
            <span>Total:</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>
        {/* Map - Show delivery location with courier tracking */}
        <div>
          <h3 className='font-semibold text-foreground mb-3'>
            {order.orderStatus === 'transportation' ? 'Delivery Tracking' : 'Delivery Location'}
          </h3>
          <OrderMap
            ref={(el) => {
              if (el) mapRefs.current.set(order._id, el);
              else mapRefs.current.delete(order._id);
            }}
            address={order.streetAddress}
            city={order.city}
            postalCode={order.postalCode}
            country={order.country}
            customerEmail={order.email}
            enableCourierPolling={enableCourierPolling}
          />
        </div>
        {/* Delivery Status */}
        <div className='bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm'>
          <p className='text-blue-900 dark:text-blue-100 font-semibold'>
            📍 This order is currently being transported
          </p>
          <p className='text-blue-800 dark:text-blue-200 mt-2'>
            Please complete delivery and mark as delivered when done.
          </p>
        </div>
        {/* Complete Order Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              disabled={completing === order._id}
              className='w-full bg-primary hover:bg-primary/90'
            >
              {completing === order._id ? 'Marking as Delivered...' : 'Mark as Delivered'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Complete Delivery</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to complete your delivery for order #
                {order._id.slice(-8).toUpperCase()}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className='flex gap-3 justify-end'>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onComplete(order._id)}
                className='bg-primary hover:bg-primary/90'
              >
                Confirm
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CardContent>
  </Card>
);

export default DeliveryOrderCard;
