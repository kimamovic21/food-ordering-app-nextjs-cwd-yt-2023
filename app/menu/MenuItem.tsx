'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Image from 'next/image';
import Pizza from '@/public/pizza.png';

interface MenuItemType {
  _id: string;
  image?: string;
  name: string;
  description: string;
  category?: { _id: string; name: string } | string;
  priceSmall: number | null;
  priceMedium: number | null;
  priceLarge: number | null;
}

interface MenuItemProps {
  item?: MenuItemType;
}

type Size = 'small' | 'medium' | 'large' | 'single';

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

  useEffect(() => {
    if (availableSizes.length === 1) {
      setSelectedSize('single');
      return;
    }

    if (availableSizes.length > 0) {
      const firstSize = availableSizes[0].size;
      setSelectedSize((prev) => (availableSizes.some((s) => s.size === prev) ? prev : firstSize));
    }
  }, [displayItem._id, displayItem.priceSmall, displayItem.priceMedium, displayItem.priceLarge]);

  const getPrice = () => {
    if (selectedSize === 'single') {
      return availableSizes[0]?.value ?? null;
    }

    const selected = availableSizes.find((s) => s.size === selectedSize);
    if (selected) return selected.value;
    return availableSizes[0]?.value ?? null;
  };

  const handleAddToCart = () => {
    const price = getPrice();
    if (price == null) return;

    const sizeForCart = availableSizes.length === 1 ? 'single' : selectedSize;

    addToCart({
      _id: displayItem._id,
      name: displayItem.name,
      description: displayItem.description,
      image: displayItem.image,
      size: sizeForCart,
      price,
    });
    toast.success(
      availableSizes.length === 1
        ? `${displayItem.name} added to cart!`
        : `${displayItem.name} (${selectedSize}) added to cart!`,
      {
        style: {
          background: '#22c55e', // Tailwind green-500
          color: 'white',
        },
      }
    );
  };

  return (
    <Card className='p-0 overflow-hidden hover:shadow-lg transition-shadow flex flex-col'>
      <div className='text-center relative h-40 p-4 bg-muted'>
        {isRemoteImage ? (
          <Image
            src={imageUrl}
            alt={displayItem.name}
             width={140}
            height={140}
            className='mx-auto h-40 w-auto object-contain'
          />
        ) : (
          <Image
            src={imageUrl}
            alt={displayItem.name}
            width={140}
            height={140}
            className='mx-auto'
          />
        )}
      </div>

      <div className='p-4 flex flex-col flex-1'>
        <h4 className='font-semibold text-xl'>{displayItem.name}</h4>

        <p className='mt-4 text-muted-foreground text-sm flex-1'>{displayItem.description}</p>

        {availableSizes.length > 1 && (
          <div className='flex gap-1 justify-center mt-4'>
            {availableSizes.map((entry) => (
              <Button
                key={entry.size}
                onClick={() => setSelectedSize(entry.size)}
                variant={selectedSize === entry.size ? 'default' : 'outline'}
                size='sm'
              >
                {entry.size.charAt(0).toUpperCase() + entry.size.slice(1)}
              </Button>
            ))}
          </div>
        )}

        <Button onClick={handleAddToCart} className='w-full mt-4' size='lg' disabled={getPrice() == null}>
          Add to cart ${getPrice()?.toFixed(2) || '0.00'}
        </Button>
      </div>
    </Card>
  );
};

export default MenuItem;
