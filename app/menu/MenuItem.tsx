'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
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
    <div className='bg-gray-200 p-4 rounded-lg text-center group hover:bg-gray-100 transition-all hover:shadow-md hover:shadow-black/20 flex flex-col'>
      <div className='text-center relative h-40'>
        {isRemoteImage ? (
          <img src={imageUrl} alt={displayItem.name} className='mx-auto h-40 w-auto object-contain' />
        ) : (
          <Image src={imageUrl} alt={displayItem.name} width={140} height={140} className='mx-auto' />
        )}
      </div>

      <h4 className='font-semibold my-4 text-xl'>
        {displayItem.name}
      </h4>

      <p className='mt-4 text-gray-600 text-sm grow'>
        {displayItem.description}
      </p>

      <div className='flex gap-1 justify-center mt-3'>
        <button
          onClick={() => setSelectedSize('small')}
          className={`px-2 py-1 rounded text-xs transition ${selectedSize === 'small' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
        >
          Small
        </button>

        <button
          onClick={() => setSelectedSize('medium')}
          className={`px-2 py-1 rounded text-xs transition ${selectedSize === 'medium' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
        >
          Medium
        </button>

        <button
          onClick={() => setSelectedSize('large')}
          className={`px-2 py-1 rounded text-xs transition ${selectedSize === 'large' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
        >
          Large
        </button>
      </div>

      <button
        onClick={handleAddToCart}
        className='mt-4 bg-primary text-white rounded-full px-8 py-2 hover:bg-orange-700 transition'
      >
        Add to cart ${getPrice()?.toFixed(2) || '0.00'}
      </button>
    </div>
  );
};

export default MenuItem;
