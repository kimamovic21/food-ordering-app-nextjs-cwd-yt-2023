'use client';

import { BellRing } from 'lucide-react';
import { useState } from 'react';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
import { Button } from '@/components/ui/button';
import { cn } from '@/libs/utils';

type RestaurantAvailabilityNotifyButtonProps = {
  restaurantId: string;
  restaurantName?: string;
  className?: string;
};

const RestaurantAvailabilityNotifyButton = ({
  restaurantId,
  restaurantName = 'This restaurant',
  className,
}: RestaurantAvailabilityNotifyButtonProps) => {
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);

  const handleRequest = async () => {
    if (!restaurantId) return;

    setRequesting(true);

    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/availability-alert`, {
        method: 'POST',
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Failed to request availability notification');
      }

      setRequested(true);
      sonnerToast.success(
        json.message || `We will notify you when ${restaurantName} is available.`
      );
    } catch (error) {
      sonnerToast.error(
        error instanceof Error ? error.message : 'Failed to request availability notification'
      );
    } finally {
      setRequesting(false);
    }
  };

  return (
    <Button
      type='button'
      variant='outline'
      size='sm'
      onClick={handleRequest}
      disabled={requesting || requested}
      className={cn('gap-2', className)}
    >
      <BellRing className='size-4' />
      {requested ? 'Notification requested' : requesting ? 'Requesting...' : 'Notify me'}
    </Button>
  );
};

export default RestaurantAvailabilityNotifyButton;
