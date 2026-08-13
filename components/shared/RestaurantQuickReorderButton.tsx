'use client';

import { RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
import { Button } from '@/components/ui/button';
import { useCart, type CartItem } from '@/contexts/CartContext';
import { cn } from '@/libs/utils';

type RestaurantQuickReorderButtonProps = {
  restaurantId: string;
  restaurantName?: string;
  className?: string;
  variant?: React.ComponentProps<typeof Button>['variant'];
};

const RestaurantQuickReorderButton = ({
  restaurantId,
  restaurantName = 'this restaurant',
  className,
  variant = 'default',
}: RestaurantQuickReorderButtonProps) => {
  const router = useRouter();
  const { replaceCart } = useCart();
  const [loading, setLoading] = useState(false);

  const handleQuickReorder = async () => {
    if (!restaurantId) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/quick-reorder`, {
        method: 'POST',
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || `Unable to reorder from ${restaurantName}.`);
      }

      replaceCart((json.cartItems || []) as CartItem[]);
      sonnerToast.success(`Previous ${restaurantName} order added to your cart.`);
      router.push('/cart');
    } catch (error) {
      sonnerToast.error(error instanceof Error ? error.message : 'Unable to reorder right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type='button'
      variant={variant}
      onClick={handleQuickReorder}
      disabled={loading}
      className={cn('gap-2', className)}
    >
      <RefreshCcw className='size-4' />
      {loading ? 'Checking...' : 'Order again'}
    </Button>
  );
};

export default RestaurantQuickReorderButton;
