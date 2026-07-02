import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useState } from 'react';
import OrderElapsedTime from '@/components/shared/OrderElapsedTime';
import ReportProblemDialog from '@/components/shared/ReportProblemDialog';
import { formatAppDate, formatAppTime } from '@/libs/dateFormat';

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
  specialInstructions?: string;
  deliveryDistanceKm?: number | null;
  estimatedDeliveryMinutes?: number | null;
  cartProducts: CartProduct[];
  total: number;
  paymentStatus: boolean;
  orderStatus:
    | 'placed'
    | 'processing'
    | 'ready'
    | 'transportation'
    | 'delivered'
    | 'completed'
    | 'canceled';
  courierId?: { _id: string; name: string; email: string; image?: string };
  courierAssignmentStatus?: 'pending' | 'accepted' | 'declined' | null;
  restaurantHandedToCourierAt?: string | null;
  courierPickedUpAt?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
};

interface DeliveryOrderCardProps {
  order: OrderDetailsType;
  completing: string | null;
  updatingAssignment: string | null;
  onAssignmentAction: (
    orderId: string,
    action: 'accept-assignment' | 'decline-assignment' | 'pick-up'
  ) => void;
  onComplete: (orderId: string, deliveryPin: string) => void;
  mapRefs: React.MutableRefObject<Map<string, OrderMapHandle>>;
  enableCourierPolling?: boolean;
}

const DeliveryOrderCard: React.FC<DeliveryOrderCardProps> = ({
  order,
  completing,
  updatingAssignment,
  onAssignmentAction,
  onComplete,
  mapRefs,
  enableCourierPolling = true,
}) => {
  const [deliveryPin, setDeliveryPin] = useState('');
  const isPendingAssignment = order.courierAssignmentStatus === 'pending';
  const isAcceptedAssignment = order.courierAssignmentStatus === 'accepted';
  const canPickUp =
    isAcceptedAssignment && Boolean(order.restaurantHandedToCourierAt) && !order.courierPickedUpAt;
  const isDelivering = order.orderStatus === 'transportation';
  const deliveryDistanceKm =
    typeof order.deliveryDistanceKm === 'number' && Number.isFinite(order.deliveryDistanceKm)
      ? order.deliveryDistanceKm
      : null;
  const estimatedDeliveryMinutes =
    typeof order.estimatedDeliveryMinutes === 'number' && order.estimatedDeliveryMinutes > 0
      ? order.estimatedDeliveryMinutes
      : null;

  return (
    <Card className='hover:shadow-lg transition-shadow'>
      <CardHeader>
        <div className='flex items-start justify-between'>
          <div>
            <CardTitle className='text-lg'>Order #{order._id.slice(-8).toUpperCase()}</CardTitle>
            <CardDescription>
              Placed on {formatAppDate(order.createdAt)} at {formatAppTime(order.createdAt)}
            </CardDescription>
          </div>
          <div className='flex flex-col items-end gap-2'>
            <Badge
              variant='secondary'
              className='bg-amber-100 text-amber-800 hover:bg-amber-100 capitalize'
            >
              {isPendingAssignment ? 'Pending' : isDelivering ? 'Transportation' : 'Accepted'}
            </Badge>
            <OrderElapsedTime
              createdAt={order.createdAt}
              completedAt={order.completedAt}
              isCompleted={order.orderStatus === 'completed'}
            />
          </div>
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
          {order.specialInstructions?.trim() && (
            <div className='rounded-lg border bg-muted/20 p-4'>
              <h3 className='font-semibold text-foreground mb-2'>Special Instructions</h3>
              <p className='whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground'>
                {order.specialInstructions}
              </p>
            </div>
          )}
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
              heightClassName='h-[460px] lg:h-[540px]'
            />
          </div>
          {/* Delivery Status */}
          <div className='rounded-lg border bg-muted/40 p-4 text-sm'>
            <p className='font-semibold text-foreground'>
              {isPendingAssignment
                ? 'Assignment waiting for your response'
                : canPickUp
                  ? 'Restaurant handed this order to you'
                  : isDelivering
                    ? 'This order is currently being transported'
                    : 'Waiting for restaurant handoff'}
            </p>
            <p className='mt-2 text-muted-foreground'>
              {isPendingAssignment
                ? 'Accept it if you can deliver this order, or decline so the restaurant can choose another courier.'
                : canPickUp
                  ? 'Mark the order as picked up to start live delivery.'
                  : isDelivering
                    ? 'Ask the customer for the delivery PIN and record the delivery handoff when done.'
                    : 'The restaurant will mark this order as handed to you before pickup.'}
            </p>
          </div>
          <ReportProblemDialog orderId={order._id} defaultTarget='app_support' />

          {(deliveryDistanceKm !== null || estimatedDeliveryMinutes !== null) && (
            <div className='rounded-lg border bg-muted/20 p-4'>
              <h3 className='font-semibold text-foreground mb-3'>Route Summary</h3>
              <div className='grid gap-3 text-sm sm:grid-cols-2'>
                <div>
                  <span className='text-muted-foreground'>Restaurant to customer</span>
                  <p className='font-medium text-foreground'>
                    {deliveryDistanceKm !== null
                      ? `${deliveryDistanceKm.toFixed(1)} km`
                      : 'Not calculated'}
                  </p>
                </div>
                <div>
                  <span className='text-muted-foreground'>Estimated travel time</span>
                  <p className='font-medium text-foreground'>
                    {estimatedDeliveryMinutes !== null
                      ? `${estimatedDeliveryMinutes} min`
                      : 'Not set'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {isPendingAssignment && (
            <div className='grid gap-3 sm:grid-cols-2'>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type='button' disabled={updatingAssignment === order._id}>
                    {updatingAssignment === order._id ? 'Updating...' : 'Accept delivery'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Accept this delivery?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Confirm that you can deliver order #{order._id.slice(-8).toUpperCase()}. The
                      restaurant will prepare the handoff after you accept.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className='flex gap-3 justify-end'>
                    <AlertDialogCancel disabled={updatingAssignment === order._id}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onAssignmentAction(order._id, 'accept-assignment')}
                      disabled={updatingAssignment === order._id}
                    >
                      Yes, accept
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type='button'
                    variant='outline'
                    disabled={updatingAssignment === order._id}
                  >
                    Decline
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Decline this delivery?</AlertDialogTitle>
                    <AlertDialogDescription>
                      If you decline order #{order._id.slice(-8).toUpperCase()}, the restaurant
                      owner will need to choose another courier.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className='flex gap-3 justify-end'>
                    <AlertDialogCancel disabled={updatingAssignment === order._id}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onAssignmentAction(order._id, 'decline-assignment')}
                      disabled={updatingAssignment === order._id}
                    >
                      Yes, decline
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {canPickUp && (
            <Button
              type='button'
              onClick={() => onAssignmentAction(order._id, 'pick-up')}
              disabled={updatingAssignment === order._id}
              className='w-full'
            >
              {updatingAssignment === order._id ? 'Recording pickup...' : 'Mark as picked up'}
            </Button>
          )}

          {isDelivering && (
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
                    Enter the customer&apos;s delivery PIN to record the handoff for order #
                    {order._id.slice(-8).toUpperCase()}. The customer or restaurant admin will
                    finish the final confirmation.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className='space-y-2'>
                  <label htmlFor={`delivery-pin-${order._id}`} className='text-sm font-medium'>
                    Delivery PIN
                  </label>
                  <Input
                    id={`delivery-pin-${order._id}`}
                    value={deliveryPin}
                    onChange={(event) =>
                      setDeliveryPin(event.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    inputMode='numeric'
                    placeholder='6 digit PIN'
                    maxLength={6}
                  />
                </div>
                <div className='flex gap-3 justify-end'>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onComplete(order._id, deliveryPin)}
                    disabled={deliveryPin.length !== 6 || completing === order._id}
                    className='bg-primary hover:bg-primary/90'
                  >
                    Confirm
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryOrderCard;
