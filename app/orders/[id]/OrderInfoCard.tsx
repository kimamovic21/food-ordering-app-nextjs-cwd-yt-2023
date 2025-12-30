import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type OrderInfoCardProps = {
  orderId: string;
  paid: boolean;
  createdAt: string;
  updatedAt: string;
  stripeSessionId?: string;
};

const OrderInfoCard = ({
  orderId,
  paid,
  createdAt,
  updatedAt,
  stripeSessionId,
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
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <p className='text-sm text-muted-foreground'>Order ID</p>
            <p className='font-semibold text-foreground'>{orderId}</p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Status</p>
            <Badge
              variant={paid ? 'default' : 'destructive'}
              className={paid ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
            >
              {paid ? 'Paid' : 'Unpaid'}
            </Badge>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Order Date</p>
            <p className='font-semibold text-foreground'>{formatDate(createdAt)}</p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Last Updated</p>
            <p className='font-semibold text-foreground'>{formatDate(updatedAt)}</p>
          </div>
          {stripeSessionId && (
            <div className='md:col-span-2'>
              <p className='text-sm text-muted-foreground'>Stripe Session ID</p>
              <p className='font-mono text-sm text-foreground break-all'>{stripeSessionId}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderInfoCard;
