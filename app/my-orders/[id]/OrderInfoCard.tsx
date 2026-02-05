import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type OrderInfoCardProps = {
  orderId: string;
  paymentStatus: boolean;
  orderStatus: 'placed' | 'processing' | 'ready' | 'transportation' | 'completed';
  createdAt: string;
  taxPercentage?: number;
  deliveryFee?: number;
};

const OrderInfoCard = ({
  orderId,
  paymentStatus,
  orderStatus,
  createdAt,
  taxPercentage,
  deliveryFee,
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
    <Card className='p-6 bg-card text-card-foreground border border-border shadow-sm'>
      <h2 className='text-lg font-semibold mb-4'>Order Information</h2>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <p className='text-sm text-muted-foreground'>Order ID</p>
          <p className='font-semibold break-all text-xs sm:text-sm' title={orderId}>
            {orderId}
          </p>
        </div>
        <div className='md:col-span-2'>
          <p className='text-sm text-muted-foreground'>Order Date</p>
          <p
            className='font-semibold whitespace-nowrap text-sm md:text-base'
            title={formatDate(createdAt)}
          >
            {formatDate(createdAt)}
          </p>
        </div>
        <div>
          <p className='text-sm text-muted-foreground'>Order Status</p>
          <Badge
            variant='secondary'
            className={
              orderStatus === 'completed'
                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 capitalize'
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
            variant={paymentStatus ? 'secondary' : 'destructive'}
            className={paymentStatus ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' : ''}
          >
            {paymentStatus ? 'Paid' : 'Unpaid'}
          </Badge>
        </div>

        {/* Fee Details */}
        {(deliveryFee !== undefined || taxPercentage !== undefined) && (
          <div className='md:col-span-2 border-t pt-4'>
            <p className='text-sm text-muted-foreground mb-2 font-semibold'>Fee Details</p>
            <div className='space-y-1 text-sm'>
              {taxPercentage !== undefined && (
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Tax:</span>
                  <span className='font-semibold text-foreground'>{taxPercentage}%</span>
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
    </Card>
  );
};

export default OrderInfoCard;
