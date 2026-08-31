'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import useFavorites from '@/hooks/useFavorites';
import useProfile from '@/hooks/useProfile';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
import Image from 'next/image';
import Link from 'next/link';
import Pizza from '@/public/pizza.png';
import FavoriteToggleButton from '@/components/shared/FavoriteToggleButton';
import HeartRating from '@/components/shared/HeartRating';
import type { CartSize } from '@/types/cart';
import type { MenuItemListItem } from '@/types/menu';

interface MenuItemProps {
  item?: MenuItemListItem;
  href?: string;
}

const MenuItem = ({ item, href }: MenuItemProps) => {
  const [userSelectedSize] = useState<CartSize>('small');
  const { addToCart, getCartRestaurantId } = useCart();
  const { data: profileData, loading: profileLoading } = useProfile();
  const { data: favoritesData, setMenuItemFavorite } = useFavorites();

  const displayItem = item || {
    _id: 'default',
    name: 'Pepperoni Pizza',
    description: 'Classic pizza topped with spicy pepperoni and mozzarella cheese.',
    image: Pizza.src,
    priceSmall: 10,
    priceMedium: 13,
    priceLarge: 16,
    restaurantId: 'default',
    isAvailable: true,
  };
  const isAvailable = displayItem.isAvailable !== false;

  const imageUrl = displayItem.image || Pizza.src;
  const isRemoteImage =
    typeof imageUrl === 'string' &&
    (imageUrl.startsWith('http') || imageUrl.includes('cloudinary'));

  const availableSizes = (['small', 'medium', 'large'] as CartSize[])
    .map((size) => {
      const value =
        size === 'small'
          ? displayItem.priceSmall
          : size === 'medium'
            ? displayItem.priceMedium
            : displayItem.priceLarge;
      return { size, value };
    })
    .filter((entry) => typeof entry.value === 'number' && Number.isFinite(entry.value));

  const effectiveSelectedSize: CartSize = (() => {
    if (availableSizes.length === 1) return 'single';
    if (availableSizes.some((entry) => entry.size === userSelectedSize)) return userSelectedSize;
    return availableSizes[0]?.size ?? 'small';
  })();

  const getPrice = () => {
    if (effectiveSelectedSize === 'single') {
      return availableSizes[0]?.value ?? null;
    }

    const selected = availableSizes.find((s) => s.size === effectiveSelectedSize);
    if (selected) return selected.value;
    return availableSizes[0]?.value ?? null;
  };

  const normalizeId = (value: unknown): string => {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && '_id' in (value as Record<string, unknown>)) {
      return String((value as Record<string, unknown>)._id || '');
    }
    return String(value);
  };

  const handleAddToCart = () => {
    if (profileLoading) {
      return;
    }

    if (!isAvailable) {
      sonnerToast.error(`${displayItem.name} is currently unavailable`);
      return;
    }

    const cartRestaurantId = getCartRestaurantId();
    const currentUserId = normalizeId(profileData?._id);
    const currentUserRestaurantId = normalizeId(profileData?.restaurantId);
    const itemAdminId = normalizeId((displayItem as unknown as { adminId?: string }).adminId);
    const itemRestaurantId = normalizeId(displayItem.restaurantId);

    if (
      (currentUserRestaurantId && currentUserRestaurantId === itemRestaurantId) ||
      (currentUserId && itemAdminId && currentUserId === itemAdminId)
    ) {
      sonnerToast.error('You cannot order from your own restaurant', {
        style: {
          background: '#dc2626',
          color: 'white',
        },
      });
      return;
    }

    if (cartRestaurantId && cartRestaurantId !== itemRestaurantId) {
      sonnerToast.error('Your cart contains items from another restaurant', {
        description: 'Clear your cart to add items from a different restaurant',
        duration: 4000,
      });
      return;
    }

    const price = getPrice();
    if (price == null) return;

    const sizeForCart = availableSizes.length === 1 ? 'single' : effectiveSelectedSize;

    addToCart({
      _id: displayItem._id,
      name: displayItem.name,
      description: displayItem.description,
      image: displayItem.image,
      size: sizeForCart,
      price,
      restaurantId: itemRestaurantId,
    });

    sonnerToast.success(
      availableSizes.length === 1
        ? `${displayItem.name} added to cart!`
        : `${displayItem.name} (${effectiveSelectedSize}) added to cart!`,
      {
        style: {
          background: '#22c55e',
          color: 'white',
        },
      }
    );
  };

  return (
    <>
      <Card className='flex h-full min-h-[21rem] flex-col overflow-hidden p-0 transition-shadow hover:shadow-lg'>
        <Link
          href={href || `/menu/${displayItem._id}`}
          className='relative flex h-44 shrink-0 items-center justify-center overflow-hidden bg-muted p-4 text-center transition-colors hover:bg-muted/80'
        >
          <div className='relative h-full w-full'>
            <Image
              src={imageUrl}
              alt={displayItem.name}
              fill
              sizes='(min-width: 1024px) 25vw, (min-width: 768px) 40vw, 85vw'
              className='object-contain'
              unoptimized={isRemoteImage}
              onError={() => {
                console.warn(`Failed to load image: ${imageUrl}`);
              }}
            />
          </div>
          {!isAvailable && (
            <div className='absolute inset-0 flex items-center justify-center bg-black/65 text-white'>
              <span className='rounded-full border border-white/40 bg-black/40 px-4 py-2 text-sm font-semibold'>
                Currently unavailable
              </span>
            </div>
          )}
        </Link>

        <div className='flex flex-1 flex-col p-4'>
          <div className='mb-2 flex justify-center'>
            <Badge
              variant={isAvailable ? 'outline' : 'destructive'}
              className={
                isAvailable
                  ? 'border-transparent bg-green-600 text-white hover:bg-green-700 dark:bg-green-600'
                  : undefined
              }
            >
              {isAvailable ? 'Available' : 'Unavailable'}
            </Badge>
          </div>
          <Link href={href || `/menu/${displayItem._id}`} className='group'>
            <h4 className='text-center text-lg font-semibold transition-colors group-hover:text-primary'>
              {displayItem.name}
            </h4>
          </Link>
          <div className='mt-2 flex justify-center'>
            <HeartRating
              rating={displayItem.restaurantAverageRating ?? 0}
              ratingCount={displayItem.restaurantRatingCount ?? 0}
            />
          </div>

          <div className='mt-auto flex gap-2 pt-4'>
            <Button
              onClick={handleAddToCart}
              className='flex-1'
              size='lg'
              disabled={!isAvailable || getPrice() == null}
            >
              {isAvailable ? `Add to cart $${getPrice()?.toFixed(2) || '0.00'}` : 'Unavailable'}
            </Button>
            <FavoriteToggleButton
              type='menu-item'
              targetId={displayItem._id}
              isFavorite={favoritesData.favoriteMenuItemIds.includes(displayItem._id)}
              onChanged={(isFavorite) => setMenuItemFavorite(displayItem._id, isFavorite)}
              className='px-3'
            />
          </div>
        </div>
      </Card>
    </>
  );
};

export default MenuItem;
