import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock3,
  CreditCard,
  Handshake,
  PackageCheck,
  ReceiptText,
  Truck,
  Utensils,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatAppDateTime } from '@/libs/dateFormat';
import { cn } from '@/libs/utils';
import type { EntityId, ISODateString } from '@/types/common';
import type { DeliveryCompletedBy, OrderCanceledBy, OrderStatus } from '@/types/order';
import type { UserSummary } from '@/types/user';

type OrderActivityStatus = 'done' | 'current' | 'pending' | 'warning' | 'danger';

export type OrderActivityEvent = {
  id: string;
  title: string;
  description: string;
  timestamp?: ISODateString | Date | null;
  status: OrderActivityStatus;
  Icon: LucideIcon;
};

type OrderActivityLogOrder = {
  _id?: EntityId;
  createdAt?: ISODateString | Date | null;
  updatedAt?: ISODateString | Date | null;
  paymentStatus?: boolean;
  orderStatus: OrderStatus;
  receiptEmailSentAt?: ISODateString | Date | null;
  processingAt?: ISODateString | Date | null;
  readyAt?: ISODateString | Date | null;
  courierAssignedAt?: ISODateString | Date | null;
  courierAcceptedAt?: ISODateString | Date | null;
  courierDeclinedAt?: ISODateString | Date | null;
  courierAssignmentExpiredAt?: ISODateString | Date | null;
  restaurantHandedToCourierAt?: ISODateString | Date | null;
  courierPickedUpAt?: ISODateString | Date | null;
  transportationAt?: ISODateString | Date | null;
  courierDeliveredAt?: ISODateString | Date | null;
  customerConfirmedDeliveryAt?: ISODateString | Date | null;
  adminConfirmedDeliveryAt?: ISODateString | Date | null;
  deliveryCompletedBy?: DeliveryCompletedBy;
  failedDeliveryRequestedAt?: ISODateString | Date | null;
  failedDeliveryVerifiedAt?: ISODateString | Date | null;
  failedDeliveryVerifiedByRole?: 'restaurant_owner' | 'super_admin' | null;
  failedDeliveryReason?: string | null;
  canceledAt?: ISODateString | Date | null;
  canceledBy?: OrderCanceledBy;
  cancellationReason?: string | null;
  completedAt?: ISODateString | Date | null;
  courierId?: UserSummary | EntityId | null;
  courier?: UserSummary | null;
  courierAssignmentStatus?: 'pending' | 'accepted' | 'declined' | 'expired' | null;
};

type OrderActivityLogProps = {
  order: OrderActivityLogOrder;
  audience?: 'customer' | 'admin';
};

const statusRank: Record<OrderStatus, number> = {
  placed: 0,
  processing: 1,
  ready: 2,
  transportation: 3,
  delivered: 4,
  completed: 5,
  canceled: 6,
};

const completedByLabels: Record<Exclude<DeliveryCompletedBy, null>, string> = {
  admin: 'Admin confirmed the final delivery state.',
  customer: 'Customer confirmed the order was received.',
};

const canceledByLabels: Record<Exclude<OrderCanceledBy, null>, string> = {
  customer: 'Customer canceled the unpaid order before kitchen work started.',
  restaurant_owner: 'Restaurant owner verified the cancellation.',
  super_admin: 'Super admin canceled this order.',
  system: 'The app canceled this order automatically.',
};

const verifiedByLabels = {
  restaurant_owner: 'Restaurant owner verified the failed delivery.',
  super_admin: 'Super admin verified the failed delivery.',
};

const hasReachedStatus = (orderStatus: OrderStatus, status: OrderStatus) =>
  orderStatus !== 'canceled' && statusRank[orderStatus] >= statusRank[status];

const hasCourierAssigned = (order: OrderActivityLogOrder) =>
  Boolean(order.courierAssignedAt || order.courierId || order.courier?._id);

const getCompletionDescription = (order: OrderActivityLogOrder) => {
  if (order.deliveryCompletedBy && completedByLabels[order.deliveryCompletedBy]) {
    return completedByLabels[order.deliveryCompletedBy];
  }

  return 'The order was completed successfully.';
};

const getCancellationDescription = (order: OrderActivityLogOrder) => {
  const base =
    order.canceledBy && canceledByLabels[order.canceledBy]
      ? canceledByLabels[order.canceledBy]
      : 'This order was canceled.';
  const reason = order.cancellationReason?.trim();

  return reason ? `${base} Reason: ${reason}` : base;
};

export const buildOrderActivityEvents = (
  order: OrderActivityLogOrder,
  audience: OrderActivityLogProps['audience'] = 'customer'
): OrderActivityEvent[] => {
  const isCanceled = order.orderStatus === 'canceled' || Boolean(order.canceledAt);

  const events: OrderActivityEvent[] = [
    {
      id: 'placed',
      title: 'Order placed',
      description: 'The order was created and saved.',
      timestamp: order.createdAt,
      status: 'done',
      Icon: ReceiptText,
    },
    {
      id: 'payment',
      title: order.paymentStatus
        ? 'Payment confirmed'
        : isCanceled
          ? 'Payment not completed'
          : 'Payment pending',
      description: order.paymentStatus
        ? 'Stripe payment is confirmed for this order.'
        : isCanceled
          ? 'This order is currently marked unpaid.'
          : 'Checkout payment still needs to be completed.',
      timestamp: order.receiptEmailSentAt,
      status: order.paymentStatus ? 'done' : isCanceled ? 'danger' : 'current',
      Icon: CreditCard,
    },
    {
      id: 'kitchen-started',
      title: 'Kitchen started',
      description: 'Restaurant started preparing the food.',
      timestamp: order.processingAt,
      status: order.processingAt
        ? 'done'
        : !isCanceled && order.paymentStatus && order.orderStatus === 'placed'
          ? 'current'
          : 'pending',
      Icon: Utensils,
    },
    {
      id: 'ready',
      title: 'Ready for pickup',
      description: 'Kitchen marked the order ready for courier pickup.',
      timestamp: order.readyAt,
      status: order.readyAt
        ? 'done'
        : !isCanceled && hasReachedStatus(order.orderStatus, 'processing')
          ? 'current'
          : 'pending',
      Icon: PackageCheck,
    },
    {
      id: 'courier-assigned',
      title: 'Courier assigned',
      description:
        audience === 'admin'
          ? 'A courier was selected for this order.'
          : 'A courier was assigned to pick up the order.',
      timestamp: order.courierAssignedAt,
      status: hasCourierAssigned(order)
        ? 'done'
        : !isCanceled && hasReachedStatus(order.orderStatus, 'ready')
          ? 'current'
          : 'pending',
      Icon: Truck,
    },
    {
      id: 'courier-accepted',
      title:
        order.courierAssignmentStatus === 'pending'
          ? 'Waiting for courier response'
          : 'Courier accepted',
      description:
        order.courierAssignmentStatus === 'pending'
          ? 'The assigned courier needs to accept or decline this delivery.'
          : 'Courier accepted the restaurant delivery assignment.',
      timestamp: order.courierAcceptedAt,
      status: order.courierAcceptedAt
        ? 'done'
        : order.courierAssignmentStatus === 'pending'
          ? 'current'
          : 'pending',
      Icon: CheckCircle2,
    },
    {
      id: 'restaurant-handoff',
      title: 'Restaurant handoff',
      description: 'Restaurant handed the food to the courier.',
      timestamp: order.restaurantHandedToCourierAt,
      status: order.restaurantHandedToCourierAt
        ? 'done'
        : order.courierAcceptedAt
          ? 'current'
          : 'pending',
      Icon: Handshake,
    },
    {
      id: 'in-transport',
      title: 'In transport',
      description: 'Courier picked up the order and started delivery travel.',
      timestamp: order.transportationAt || order.courierPickedUpAt,
      status:
        order.transportationAt || order.courierPickedUpAt
          ? 'done'
          : order.restaurantHandedToCourierAt
            ? 'current'
            : 'pending',
      Icon: Truck,
    },
    {
      id: 'delivered',
      title: 'Delivered by courier',
      description: 'Courier entered the delivery PIN and marked the order delivered.',
      timestamp: order.courierDeliveredAt,
      status: order.courierDeliveredAt
        ? 'done'
        : order.orderStatus === 'transportation'
          ? 'current'
          : 'pending',
      Icon: PackageCheck,
    },
    {
      id: 'completed',
      title: 'Order completed',
      description: getCompletionDescription(order),
      timestamp:
        order.completedAt || order.customerConfirmedDeliveryAt || order.adminConfirmedDeliveryAt,
      status: order.completedAt
        ? 'done'
        : order.orderStatus === 'delivered'
          ? 'current'
          : 'pending',
      Icon: CheckCircle2,
    },
  ];

  if (order.courierDeclinedAt) {
    events.splice(6, 0, {
      id: 'courier-declined',
      title: 'Courier declined',
      description: 'The assigned courier declined this delivery.',
      timestamp: order.courierDeclinedAt,
      status: 'warning',
      Icon: AlertTriangle,
    });
  }

  if (order.courierAssignmentExpiredAt) {
    events.splice(6, 0, {
      id: 'courier-expired',
      title: 'Courier assignment expired',
      description: 'The courier did not respond in time and the assignment was released.',
      timestamp: order.courierAssignmentExpiredAt,
      status: 'warning',
      Icon: Clock3,
    });
  }

  if (order.failedDeliveryRequestedAt) {
    events.splice(-1, 0, {
      id: 'failed-delivery-requested',
      title: 'Customer unavailable reported',
      description: order.failedDeliveryReason?.trim()
        ? `Courier reported customer unavailable. Note: ${order.failedDeliveryReason.trim()}`
        : 'Courier reported customer unavailable after extended delivery time.',
      timestamp: order.failedDeliveryRequestedAt,
      status: 'warning',
      Icon: AlertTriangle,
    });
  }

  if (order.failedDeliveryVerifiedAt) {
    events.splice(-1, 0, {
      id: 'failed-delivery-verified',
      title: 'Failed delivery verified',
      description:
        order.failedDeliveryVerifiedByRole && verifiedByLabels[order.failedDeliveryVerifiedByRole]
          ? verifiedByLabels[order.failedDeliveryVerifiedByRole]
          : 'Failed delivery cancellation was verified.',
      timestamp: order.failedDeliveryVerifiedAt,
      status: 'warning',
      Icon: CheckCircle2,
    });
  }

  if (order.orderStatus === 'canceled' || order.canceledAt) {
    events.push({
      id: 'canceled',
      title: 'Order canceled',
      description: getCancellationDescription(order),
      timestamp: order.canceledAt,
      status: 'danger',
      Icon: XCircle,
    });
  }

  return events;
};

const statusLabels: Record<OrderActivityStatus, string> = {
  done: 'Done',
  current: 'Current',
  pending: 'Pending',
  warning: 'Attention',
  danger: 'Canceled',
};

const statusStyles: Record<OrderActivityStatus, string> = {
  done: 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300',
  current: 'border-primary/40 bg-primary/10 text-primary',
  pending: 'border-border bg-muted/40 text-muted-foreground',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  danger: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
};

const iconStyles: Record<OrderActivityStatus, string> = {
  done: 'border-green-500/40 bg-green-500/15 text-green-700 dark:text-green-300',
  current: 'border-primary/40 bg-primary/15 text-primary',
  pending: 'border-border bg-muted text-muted-foreground',
  warning: 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300',
  danger: 'border-red-500/40 bg-red-500/15 text-red-700 dark:text-red-300',
};

const lineStyles: Record<OrderActivityStatus, string> = {
  done: 'bg-green-500/30',
  current: 'bg-primary/30',
  pending: 'bg-border',
  warning: 'bg-amber-500/30',
  danger: 'bg-red-500/30',
};

const OrderActivityLog = ({ order, audience = 'customer' }: OrderActivityLogProps) => {
  const events = buildOrderActivityEvents(order, audience);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Activity</CardTitle>
        <CardDescription>
          A readable history of the important order events and handoffs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-0'>
          {events.map((event, index) => {
            const Icon = event.Icon;

            return (
              <div key={event.id} className='relative grid grid-cols-[2.75rem_1fr] gap-3'>
                {index < events.length - 1 && (
                  <span
                    className={cn(
                      'absolute left-[1.35rem] top-11 h-[calc(100%-1.25rem)] w-px',
                      lineStyles[event.status]
                    )}
                  />
                )}
                <div
                  className={cn(
                    'relative z-10 mt-1 flex size-11 items-center justify-center rounded-full border',
                    iconStyles[event.status]
                  )}
                >
                  {event.status === 'pending' ? (
                    <Circle className='size-4' />
                  ) : (
                    <Icon className='size-5' />
                  )}
                </div>
                <div className='pb-5 last:pb-0'>
                  <div className='flex flex-col gap-2 rounded-lg border bg-muted/20 p-4 sm:flex-row sm:items-start sm:justify-between'>
                    <div className='min-w-0'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <p className='font-semibold text-foreground'>{event.title}</p>
                        <Badge
                          variant='outline'
                          className={cn('border text-[11px]', statusStyles[event.status])}
                        >
                          {statusLabels[event.status]}
                        </Badge>
                      </div>
                      <p className='mt-1 text-sm leading-relaxed text-muted-foreground'>
                        {event.description}
                      </p>
                    </div>
                    <p className='shrink-0 text-sm text-muted-foreground'>
                      {event.timestamp ? formatAppDateTime(event.timestamp) : 'No time yet'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderActivityLog;
