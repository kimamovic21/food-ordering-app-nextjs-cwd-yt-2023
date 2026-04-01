'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

type FavoriteType = 'menu-item' | 'restaurant';

interface FavoriteToggleButtonProps {
  type: FavoriteType;
  targetId: string;
  isFavorite: boolean;
  className?: string;
  iconClassName?: string;
  showLabel?: boolean;
  onChanged?: (isFavorite: boolean) => void;
}

const endpointByType: Record<FavoriteType, string> = {
  'menu-item': '/api/favorites/menu-items',
  restaurant: '/api/favorites/restaurants',
};

const labelByType: Record<FavoriteType, string> = {
  'menu-item': 'meal',
  restaurant: 'restaurant',
};

const FavoriteToggleButton = ({
  type,
  targetId,
  isFavorite,
  className,
  iconClassName,
  showLabel = false,
  onChanged,
}: FavoriteToggleButtonProps) => {
  const { status } = useSession();
  const [isPending, setIsPending] = useState(false);
  const [localValue, setLocalValue] = useState(isFavorite);

  useEffect(() => {
    setLocalValue(isFavorite);
  }, [isFavorite]);

  const handleToggle = async () => {
    if (status !== 'authenticated') {
      toast.error('Please login to save favorites');
      return;
    }

    if (!targetId || isPending) {
      return;
    }

    setIsPending(true);

    try {
      const body = type === 'menu-item' ? { menuItemId: targetId } : { restaurantId: targetId };
      const response = await fetch(endpointByType[type], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update favorites');
      }

      const nextIsFavorite = Boolean(data?.isFavorite);
      setLocalValue(nextIsFavorite);
      onChanged?.(nextIsFavorite);

      toast.success(
        nextIsFavorite
          ? `Added to favorite ${labelByType[type]}s`
          : `Removed from favorite ${labelByType[type]}s`,
        {
          style: {
            background: '#22c55e',
            color: 'white',
          },
        }
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update favorites', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      type='button'
      variant='outline'
      size='sm'
      className={className}
      onClick={handleToggle}
      disabled={isPending}
      aria-label={localValue ? 'Remove from favorites' : 'Add to favorites'}
      title={localValue ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={`h-4 w-4 ${iconClassName || ''} ${localValue ? 'fill-red-500 text-red-500' : 'text-red-500'}`}
      />
      {showLabel && <span>{localValue ? 'Favorited' : 'Favorite'}</span>}
    </Button>
  );
};

export default FavoriteToggleButton;
