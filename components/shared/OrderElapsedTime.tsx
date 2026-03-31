'use client';

import { useOrderElapsedTime } from '@/libs/useOrderElapsedTime';
import { Clock } from 'lucide-react';

interface OrderElapsedTimeProps {
  createdAt: string;
  completedAt?: string | null;
  isCompleted?: boolean;
  showIcon?: boolean;
}

const OrderElapsedTime: React.FC<OrderElapsedTimeProps> = ({
  createdAt,
  completedAt,
  isCompleted = false,
  showIcon = true,
}) => {
  const elapsedTime = useOrderElapsedTime(createdAt, completedAt);

  return (
    <div className='flex items-center gap-2'>
      {showIcon && <Clock className='w-4 h-4 text-muted-foreground' />}
      <span className='font-mono font-semibold'>{elapsedTime}</span>
      {isCompleted && <span className='text-xs text-muted-foreground ml-1'>(completed)</span>}
    </div>
  );
};

export default OrderElapsedTime;
