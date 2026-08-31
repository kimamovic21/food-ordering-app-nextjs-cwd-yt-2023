'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import useProfile from '@/hooks/useProfile';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
import Image from 'next/image';
import Pizza from '@/public/pizza.png';
import MenuItemModal from './MenuItemModal';
import HeartRating from '@/components/shared/HeartRating';
import type { CartSize } from '@/types/cart';
import type { MenuItemListItem } from '@/types/menu';

interface MenuItemProps {
  item?: MenuItemListItem;
}

const MenuItem = ({ item }: MenuItemProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToCart, getCartRestaurantId } = useCart();
  const { data: profileData } = useProfile();

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

  const effectiveSelectedSize: CartSize =
    availableSizes.length === 1 ? 'single' : (availableSizes[0]?.size ?? 'small');

  const getPrice = () => {
    if (effectiveSelectedSize === 'single') {
      return availableSizes[0]?.value ?? null;
    }

    const selected = availableSizes.find((s) => s.size === effectiveSelectedSize);
    if (selected) return selected.value;
    return availableSizes[0]?.value ?? null;
  };

  const handleAddToCart = () => {
    const cartRestaurantId = getCartRestaurantId();

    if (!isAvailable) {
      sonnerToast.error(`${displayItem.name} is currently unavailable`);
      return;
    }

    if (profileData?.restaurantId && profileData.restaurantId === displayItem.restaurantId) {
      sonnerToast.error('You cannot order from your own restaurant', {
        style: {
          background: '#dc2626',
          color: 'white',
        },
      });
      return;
    }

    if (cartRestaurantId && cartRestaurantId !== displayItem.restaurantId) {
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
      restaurantId: displayItem.restaurantId,
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
      <Card className='p-0 overflow-hidden hover:shadow-lg transition-shadow flex flex-col'>
        <div
          className='text-center relative h-40 p-4 bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center cursor-pointer'
          onClick={() => setIsModalOpen(true)}
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
          {!isAvailable && (
            <div className='absolute inset-0 flex items-center justify-center bg-black/65 text-white'>
              <span className='rounded-full border border-white/40 bg-black/40 px-4 py-2 text-sm font-semibold'>
                Currently unavailable
              </span>
            </div>
          )}
        </div>

        <div className='p-4 flex flex-col flex-1'>
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
          <h4 className='font-semibold text-lg text-center'>{displayItem.name}</h4>
          <div className='mt-2 flex justify-center'>
            <HeartRating
              rating={displayItem.restaurantAverageRating ?? 0}
              ratingCount={displayItem.restaurantRatingCount ?? 0}
            />
          </div>

          <Button
            onClick={handleAddToCart}
            className='w-full mt-4'
            size='lg'
            disabled={!isAvailable || getPrice() == null}
          >
            {isAvailable ? `Add to cart $${getPrice()?.toFixed(2) || '0.00'}` : 'Unavailable'}
          </Button>
        </div>
      </Card>

      {item && (
        <MenuItemModal item={item} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
};

export default MenuItem;
