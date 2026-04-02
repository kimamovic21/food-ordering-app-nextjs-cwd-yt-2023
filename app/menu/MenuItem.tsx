'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import useFavorites from '@/contexts/UseFavorites';
import useProfile from '@/contexts/UseProfile';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Image from 'next/image';
import Pizza from '@/public/pizza.png';
import MenuItemModal from './MenuItemModal';
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
}

type Size = 'small' | 'medium' | 'large' | 'single';

const MenuItem = ({ item }: MenuItemProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userSelectedSize] = useState<Size>('small');
  const { addToCart, getCartRestaurantId } = useCart();
  const { data: profileData } = useProfile();
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

  const handleAddToCart = () => {
    const cartRestaurantId = getCartRestaurantId();

    if (profileData?.restaurantId && profileData.restaurantId === displayItem.restaurantId) {
      toast.error('You cannot order from your own restaurant', {
        style: {
          background: '#dc2626',
          color: 'white',
        },
      });
      return;
    }

    if (cartRestaurantId && cartRestaurantId !== displayItem.restaurantId) {
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
      restaurantId: displayItem.restaurantId,
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
        </div>

        <div className='p-4 flex flex-col flex-1'>
          <h4 className='font-semibold text-lg text-center'>{displayItem.name}</h4>
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

      {item && (
        <MenuItemModal item={item} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
};

export default MenuItem;
