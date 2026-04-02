'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import useProfile from '@/contexts/UseProfile';
import Image from 'next/image';
import Pizza from '@/public/pizza.png';
import HeartRating from '@/components/shared/HeartRating';

interface MenuItemType {
  _id: string;
  image?: string;
  name: string;
  description: string;
  category?: { _id: string; name: string } | string;
  priceSmall: number;
  priceMedium: number;
  priceLarge: number;
  restaurantId: string;
  restaurantAverageRating?: number;
  restaurantRatingCount?: number;
}

interface MenuItemProps {
  item?: MenuItemType;
}

type PizzaSize = 'small' | 'medium' | 'large';

const MenuItem = ({ item }: MenuItemProps) => {
  const [selectedSize, setSelectedSize] = useState<PizzaSize>('small');
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
  };

  const imageUrl = displayItem.image || Pizza.src;
  const isRemoteImage =
    typeof imageUrl === 'string' &&
    (imageUrl.startsWith('http') || imageUrl.includes('cloudinary'));

  const getPrice = () => {
    switch (selectedSize) {
      case 'small':
        return displayItem.priceSmall;
      case 'medium':
        return displayItem.priceMedium;
      case 'large':
        return displayItem.priceLarge;
      default:
        return displayItem.priceSmall;
    }
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

    // Check if trying to add from a different restaurant
    if (cartRestaurantId && cartRestaurantId !== displayItem.restaurantId) {
      toast.error('Your cart contains items from another restaurant', {
        description: 'Clear your cart to add items from a different restaurant',
        duration: 4000,
      });
      return;
    }

    addToCart({
      _id: displayItem._id,
      name: displayItem.name,
      description: displayItem.description,
      image: displayItem.image,
      size: selectedSize,
      price: getPrice(),
      restaurantId: displayItem.restaurantId,
    });
    toast.success(`${displayItem.name} (${selectedSize}) added to cart!`, {
      style: {
        background: '#22c55e', // Tailwind green-500
        color: 'white',
      },
    });
  };

  return (
    <Card className='p-0 overflow-hidden hover:shadow-lg transition-shadow flex flex-col'>
      <div className='text-center relative h-40 p-4 bg-muted'>
        {displayItem.image &&
        typeof displayItem.image === 'string' &&
        displayItem.image.startsWith('http') ? (
          isRemoteImage ? (
            <Image
              width={140}
              height={140}
              src={displayItem.image}
              alt={displayItem.name}
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
          <Image
            src={Pizza.src}
            alt={displayItem.name}
            width={140}
            height={140}
            className='mx-auto'
          />
        )}
      </div>

      <div className='p-4 flex flex-col flex-1'>
        <div className='text-center mb-2'>
          <h3 className='uppercase text-gray-500 dark:text-gray-400 font-semibold leading-3'>
            Check out
          </h3>
          <h4 className='text-primary font-bold text-2xl italic'>{displayItem.name}</h4>
          <div className='mt-2 flex justify-center'>
            <HeartRating
              rating={displayItem.restaurantAverageRating ?? 0}
              ratingCount={displayItem.restaurantRatingCount ?? 0}
            />
          </div>
        </div>

        <p className='mt-4 text-muted-foreground text-sm flex-1 text-center'>
          {displayItem.description}
        </p>

        <div className='flex gap-1 justify-center mt-4'>
          <Button
            onClick={() => setSelectedSize('small')}
            variant={selectedSize === 'small' ? 'default' : 'outline'}
            size='sm'
          >
            Small
          </Button>
          <Button
            onClick={() => setSelectedSize('medium')}
            variant={selectedSize === 'medium' ? 'default' : 'outline'}
            size='sm'
          >
            Medium
          </Button>
          <Button
            onClick={() => setSelectedSize('large')}
            variant={selectedSize === 'large' ? 'default' : 'outline'}
            size='sm'
          >
            Large
          </Button>
        </div>

        <Button onClick={handleAddToCart} className='w-full mt-4' size='lg'>
          Add to cart ${getPrice()?.toFixed(2) || '0.00'}
        </Button>
      </div>
    </Card>
  );
};

export default MenuItem;
