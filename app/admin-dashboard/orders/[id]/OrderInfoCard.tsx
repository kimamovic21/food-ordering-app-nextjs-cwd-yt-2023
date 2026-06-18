import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type OrderInfoCardProps = {
  orderId: string;
  paymentStatus: boolean;
  orderStatus:
    | 'placed'
    | 'processing'
    | 'ready'
    | 'transportation'
    | 'delivered'
    | 'completed'
    | 'canceled';
  createdAt: string;
  updatedAt: string;
  stripeSessionId?: string;
  deliveryPin?: string | null;
  deliveryFee?: number;
  taxPercentage?: number;
  taxAmount?: number;
};

const OrderInfoCard = ({
  orderId,
  paymentStatus,
  orderStatus,
  createdAt,
  updatedAt,
  stripeSessionId,
  deliveryPin,
  deliveryFee,
  taxPercentage,
  taxAmount,
}: OrderInfoCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {/* Row 1: Order ID (full width) */}
          <div>
            <p className='text-sm text-muted-foreground'>Order ID</p>
            <p className='font-semibold text-foreground'>{orderId}</p>
          </div>

          {/* Row 2: Order Status and Payment Status (side by side) */}
          <div className='grid grid-cols-2 gap-x-6'>
            <div>
              <p className='text-sm text-muted-foreground'>Order Status</p>
              <Badge
                variant='secondary'
                className={
                  orderStatus === 'canceled'
                    ? 'bg-red-100 text-red-800 hover:bg-red-100 capitalize'
                    : orderStatus === 'completed'
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 capitalize'
                      : orderStatus === 'delivered'
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-100 capitalize'
                        : orderStatus === 'processing'
                          ? 'bg-blue-100 text-blue-800 hover:bg-blue-100 capitalize'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-100 capitalize'
                }
              >
                {orderStatus}
              </Badge>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Payment Status</p>
              <Badge
                variant={paymentStatus ? 'default' : 'destructive'}
                className={paymentStatus ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
              >
                {paymentStatus ? 'Paid' : 'Unpaid'}
              </Badge>
            </div>
          </div>

          {/* Row 3: Order Date and Last Updated (side by side) */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4'>
            <div>
              <p className='text-sm text-muted-foreground'>Order Date</p>
              <p className='font-semibold text-foreground'>{formatDate(createdAt)}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Last Updated</p>
              <p className='font-semibold text-foreground'>{formatDate(updatedAt)}</p>
            </div>
          </div>

          {/* Row 4: Stripe Session ID (full width) */}
          {stripeSessionId && (
            <div>
              <p className='text-sm text-muted-foreground'>Stripe Session ID</p>
              <p className='font-mono text-sm text-foreground break-all'>{stripeSessionId}</p>
            </div>
          )}

          {deliveryPin && (
            <div>
              <p className='text-sm text-muted-foreground'>Delivery PIN</p>
              <p className='font-mono text-xl font-bold tracking-widest text-foreground'>
                {deliveryPin}
              </p>
            </div>
          )}

          {/* Row 5: Delivery Fee and Tax (if available) */}
          {(deliveryFee !== undefined ||
            taxPercentage !== undefined ||
            taxAmount !== undefined) && (
            <div className='border-t pt-4'>
              <p className='text-sm text-muted-foreground mb-2 font-semibold'>Fee Details</p>
              <div className='space-y-1 text-sm'>
                {taxPercentage !== undefined && (
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Tax Rate:</span>
                    <span className='font-semibold text-foreground'>{taxPercentage}%</span>
                  </div>
                )}
                {taxAmount !== undefined && (
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Included Tax Amount:</span>
                    <span className='font-semibold text-foreground'>${taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {deliveryFee !== undefined && (
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Delivery Fee:</span>
                    <span className='font-semibold text-foreground'>${deliveryFee.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderInfoCard;
