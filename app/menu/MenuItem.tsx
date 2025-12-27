'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Pizza from '@/public/pizza.png';

interface MenuItemType {
  _id: string;
  image?: string;
  name: string;
  description: string;
  category?: { _id: string; name: string } | string;
  priceSmall: number;
  priceMedium: number;
  priceLarge: number;
}

interface MenuItemProps {
  item?: MenuItemType;
}

type Size = 'small' | 'medium' | 'large';

const MenuItem = ({ item }: MenuItemProps) => {
  const [selectedSize, setSelectedSize] = useState<Size>('small');
  const { addToCart } = useCart();

  const displayItem = item || {
    _id: 'default',
    name: 'Pepperoni Pizza',
    description: 'Classic pizza topped with spicy pepperoni and mozzarella cheese.',
    image: Pizza.src,
    priceSmall: 10,
    priceMedium: 13,
    priceLarge: 16,
  };

  const imageUrl = displayItem.image || Pizza.src;
  const isRemoteImage = typeof imageUrl === 'string' && (imageUrl.startsWith('http') || imageUrl.includes('cloudinary'));

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
    };
  };

  const handleAddToCart = () => {
    addToCart({
      _id: displayItem._id,
      name: displayItem.name,
      description: displayItem.description,
      image: displayItem.image,
      size: selectedSize,
      price: getPrice(),
    });
    toast.success(`${displayItem.name} (${selectedSize}) added to cart!`);
  };

  return (
    <Card className='p-0 overflow-hidden hover:shadow-lg transition-shadow flex flex-col'>
      <div className='text-center relative h-40 p-4 bg-muted'>
        {isRemoteImage ? (
          <img src={imageUrl} alt={displayItem.name} className='mx-auto h-40 w-auto object-contain' />
        ) : (
          <Image src={imageUrl} alt={displayItem.name} width={140} height={140} className='mx-auto' />
        )}
      </div>

      <div className='p-4 flex flex-col flex-1'>
        <h4 className='font-semibold text-xl'>
          {displayItem.name}
        </h4>

        <p className='mt-4 text-muted-foreground text-sm flex-1'>
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

        <Button
          onClick={handleAddToCart}
          className='w-full mt-4'
          size='lg'
        >
          Add to cart ${getPrice()?.toFixed(2) || '0.00'}
        </Button>
      </div>
    </Card>
  );
};

export default MenuItem;
