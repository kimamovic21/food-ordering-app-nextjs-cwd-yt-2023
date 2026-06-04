'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import useFavorites from '@/hooks/useFavorites';
import useProfile from '@/hooks/useProfile';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import Pizza from '@/public/pizza.png';
import FavoriteToggleButton from '@/components/shared/FavoriteToggleButton';
import HeartRating from '@/components/shared/HeartRating';

interface MenuItemType {
  _id: string;
  image?: string;
  name: string;
  description: string;
  category?: { _id: string; name: string } | string;
  priceSmall: number | null;
  priceMedium: number | null;
  priceLarge: number | null;
  restaurantId: string;
  restaurantAverageRating?: number;
  restaurantRatingCount?: number;
}

interface MenuItemProps {
  item?: MenuItemType;
  href?: string;
}

type Size = 'small' | 'medium' | 'large' | 'single';

const MenuItem = ({ item, href }: MenuItemProps) => {
  const [userSelectedSize] = useState<Size>('small');
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
  };

  const imageUrl = displayItem.image || Pizza.src;
  const isRemoteImage =
    typeof imageUrl === 'string' &&
    (imageUrl.startsWith('http') || imageUrl.includes('cloudinary'));

  const availableSizes = (['small', 'medium', 'large'] as Size[])
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

  const effectiveSelectedSize: Size = (() => {
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

    const cartRestaurantId = getCartRestaurantId();
    const currentUserId = normalizeId(profileData?._id);
    const currentUserRestaurantId = normalizeId(profileData?.restaurantId);
    const itemAdminId = normalizeId((displayItem as unknown as { adminId?: string }).adminId);
    const itemRestaurantId = normalizeId(displayItem.restaurantId);

    if (
      (currentUserRestaurantId && currentUserRestaurantId === itemRestaurantId) ||
      (currentUserId && itemAdminId && currentUserId === itemAdminId)
    ) {
      toast.error('You cannot order from your own restaurant', {
        style: {
          background: '#dc2626',
          color: 'white',
        },
      });
      return;
    }

    if (cartRestaurantId && cartRestaurantId !== itemRestaurantId) {
      toast.error('Your cart contains items from another restaurant', {
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

    toast.success(
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
      <Card className='p-0 overflow-hidden hover:shadow-lg transition-shadow flex flex-col'>
        <Link
          href={href || `/menu/${displayItem._id}`}
          className='relative flex h-40 items-center justify-center bg-muted p-4 text-center transition-colors hover:bg-muted/80'
        >
          {displayItem.image &&
          typeof displayItem.image === 'string' &&
          displayItem.image.startsWith('http') ? (
            isRemoteImage ? (
              <Image
                src={displayItem.image}
                alt={displayItem.name}
                width={140}
                height={140}
                className='mx-auto h-40 w-auto object-contain'
                onError={() => {
                  console.warn(`Failed to load image: ${displayItem.image}`);
                }}
              />
            ) : (
              <Image
                src={displayItem.image}
                alt={displayItem.name}
                width={140}
                height={140}
                className='mx-auto'
                onError={() => {
                  console.warn(`Failed to load image: ${displayItem.image}`);
                }}
              />
            )
          ) : (
            <div className='flex items-center justify-center h-40 text-muted-foreground text-sm'>
              No image available
            </div>
          )}
        </Link>

        <div className='p-4 flex flex-col flex-1'>
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

          <div className='flex gap-2 mt-4'>
            <Button
              onClick={handleAddToCart}
              className='flex-1'
              size='lg'
              disabled={getPrice() == null}
            >
              Add to cart ${getPrice()?.toFixed(2) || '0.00'}
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
