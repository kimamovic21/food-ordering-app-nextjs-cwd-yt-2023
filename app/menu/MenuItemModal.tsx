'use client';

import { useState, useEffect } from 'react';
import { Clock, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import useProfile from '@/contexts/UseProfile';
import useFavorites from '@/contexts/UseFavorites';
import FavoriteToggleButton from '@/components/shared/FavoriteToggleButton';
import ShareActions from '@/components/shared/ShareActions';
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
  restaurantId: string;
}

interface RestaurantType {
  _id: string;
  name: string;
  street: string;
  city: string;
  postalCode: string;
  contact: string;
  email: string;
  webAddress?: string;
  description: string;
  images?: string[];
  workingHours?: Array<{
    day: string;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }>;
}

interface MenuItemModalProps {
  item: MenuItemType;
  isOpen: boolean;
  onClose: () => void;
}

type Size = 'small' | 'medium' | 'large' | 'single';

const MenuItemModal = ({ item, isOpen, onClose }: MenuItemModalProps) => {
  const [userSelectedSize, setUserSelectedSize] = useState<Size>('small');
  const [restaurant, setRestaurant] = useState<RestaurantType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addToCart, getCartRestaurantId } = useCart();
  const { data: profileData } = useProfile();
  const { data: favorites, setMenuItemFavorite, setRestaurantFavorite } = useFavorites();

  const imageUrl = item.image || Pizza.src;
  const isRemoteImage =
    typeof imageUrl === 'string' &&
    (imageUrl.startsWith('http') || imageUrl.includes('cloudinary'));

  const availableSizes = (['small', 'medium', 'large'] as Size[])
    .map((size) => {
      const value =
        size === 'small' ? item.priceSmall : size === 'medium' ? item.priceMedium : item.priceLarge;
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

  useEffect(() => {
    if (isOpen && item.restaurantId) {
      const fetchRestaurant = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/restaurant/${item.restaurantId}`);
          if (response.ok) {
            const data = await response.json();
            setRestaurant(data.restaurant);
          }
        } catch (error) {
          console.error('Error fetching restaurant:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchRestaurant();
    }
  }, [isOpen, item.restaurantId]);

  const handleAddToCart = () => {
    const cartRestaurantId = getCartRestaurantId();

    if (profileData?.restaurantId && profileData.restaurantId === item.restaurantId) {
      toast.error('You cannot order from your own restaurant', {
        style: {
          background: '#dc2626',
          color: 'white',
        },
      });
      return;
    }

    if (cartRestaurantId && cartRestaurantId !== item.restaurantId) {
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
      _id: item._id,
      name: item.name,
      description: item.description,
      image: item.image,
      size: sizeForCart,
      price,
      restaurantId: item.restaurantId,
    });

    toast.success(
      availableSizes.length === 1
        ? `${item.name} added to cart!`
        : `${item.name} (${effectiveSelectedSize}) added to cart!`,
      {
        style: {
          background: '#22c55e',
          color: 'white',
        },
      }
    );

    onClose();
  };

  const formatDay = (day: string) => day.charAt(0).toUpperCase() + day.slice(1);
  const shareBaseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const itemShareUrl = `${shareBaseUrl}/menu`;
  const restaurantShareUrl = restaurant ? `${shareBaseUrl}/restaurants/${restaurant._id}` : '';

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm'
      onClick={onClose}
    >
      <div
        className='relative bg-white dark:bg-slate-950 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Item Image - Fixed */}
        <div
          className='relative h-64 bg-gray-100 dark:bg-muted p-4 shrink-0 flex items-center justify-center cursor-pointer transition-colors'
          onClick={() => onClose()}
        >
          {item.image && typeof item.image === 'string' && item.image.startsWith('http') ? (
            isRemoteImage ? (
              <Image
                src={item.image}
                alt={item.name}
                width={300}
                height={300}
                className='mx-auto h-full w-auto object-contain'
                onError={() => {
                  console.warn(`Failed to load image: ${item.image}`);
                }}
              />
            ) : (
              <Image
                src={item.image}
                alt={item.name}
                width={300}
                height={300}
                className='mx-auto h-full w-auto object-contain'
                onError={() => {
                  console.warn(`Failed to load image: ${item.image}`);
                }}
              />
            )
          ) : (
            <div className='flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm'>
              No image available
            </div>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className='flex-1 overflow-y-auto p-6 dark:bg-muted'>
          <div className='space-y-6'>
            {/* Item Details */}
            <div>
              <h2 className='text-3xl font-bold mb-3 text-gray-900 dark:text-white'>{item.name}</h2>
              <p className='text-gray-600 dark:text-gray-300 text-base leading-relaxed'>
                {item.description}
              </p>
              <div className='mt-4 flex items-center gap-2'>
                <FavoriteToggleButton
                  type='menu-item'
                  targetId={item._id}
                  isFavorite={favorites.favoriteMenuItemIds.includes(item._id)}
                  onChanged={(nextIsFavorite) => setMenuItemFavorite(item._id, nextIsFavorite)}
                  showLabel
                />
              </div>
              <div className='mt-4'>
                <ShareActions
                  url={itemShareUrl}
                  title={`Check out this meal: ${item.name}`}
                  className='rounded-md border border-gray-200 dark:border-slate-700 p-3'
                />
              </div>
            </div>

            {/* Size Selection */}
            {availableSizes.length > 1 && (
              <div className='space-y-3'>
                <label className='text-sm font-semibold text-gray-900 dark:text-white'>
                  Select Size:
                </label>
                <div className='flex gap-2 flex-wrap'>
                  {availableSizes.map((entry) => (
                    <Button
                      key={entry.size}
                      onClick={() => setUserSelectedSize(entry.size)}
                      variant={effectiveSelectedSize === entry.size ? 'default' : 'outline'}
                      size='sm'
                    >
                      {entry.size.charAt(0).toUpperCase() + entry.size.slice(1)} - $
                      {entry.value?.toFixed(2)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              className='w-full'
              size='lg'
              disabled={getPrice() == null}
            >
              Add to cart ${getPrice()?.toFixed(2) || '0.00'}
            </Button>

            {/* Restaurant Information */}
            {isLoading ? (
              <div className='border-t border-gray-200 dark:border-slate-700 pt-6'>
                <p className='text-center text-gray-500 dark:text-gray-400'>
                  Loading restaurant info...
                </p>
              </div>
            ) : restaurant ? (
              <div className='border-t border-gray-200 dark:border-slate-700 pt-6 space-y-4'>
                <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
                  Restaurant Information
                </h3>

                {/* Restaurant Header with Image and Basic Info */}
                <div className='flex gap-4'>
                  {/* Restaurant Basic Info Box */}
                  <div className='flex-1 rounded-lg p-4 space-y-3'>
                    <div>
                      <span className='font-semibold text-gray-900 dark:text-white'>
                        {restaurant.name}
                      </span>
                      <div className='mt-3 flex flex-wrap items-center gap-2'>
                        <Link href={`/restaurants/${restaurant._id}`}>
                          <Button size='sm' variant='outline'>
                            See restaurant details
                          </Button>
                        </Link>
                        <FavoriteToggleButton
                          type='restaurant'
                          targetId={restaurant._id}
                          isFavorite={favorites.favoriteRestaurantIds.includes(restaurant._id)}
                          onChanged={(nextIsFavorite) =>
                            setRestaurantFavorite(restaurant._id, nextIsFavorite)
                          }
                        />
                      </div>
                    </div>

                    <div className='flex items-start gap-2'>
                      <MapPin className='w-4 h-4 mt-0.5 shrink-0 text-gray-600 dark:text-gray-400' />
                      <p className='text-sm text-gray-700 dark:text-gray-300'>
                        {restaurant.street}, {restaurant.city} {restaurant.postalCode}
                      </p>
                    </div>

                    <div className='flex items-start gap-2'>
                      <Phone className='w-4 h-4 mt-0.5 shrink-0 text-gray-600 dark:text-gray-400' />
                      <span className='text-sm text-gray-700 dark:text-gray-300'>
                        {restaurant.contact}
                      </span>
                    </div>

                    <div className='flex items-start gap-2'>
                      <Mail className='w-4 h-4 mt-0.5 shrink-0 text-gray-600 dark:text-gray-400' />
                      <a
                        href={`mailto:${restaurant.email}`}
                        className='text-sm text-blue-600 dark:text-blue-400 hover:underline'
                      >
                        {restaurant.email}
                      </a>
                    </div>

                    {restaurant.webAddress && (
                      <div className='flex items-start gap-2'>
                        <Globe className='w-4 h-4 mt-0.5 shrink-0 text-gray-600 dark:text-gray-400' />
                        <a
                          href={restaurant.webAddress}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-sm text-blue-600 dark:text-blue-400 hover:underline'
                        >
                          {restaurant.webAddress}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Restaurant Image */}
                  {restaurant.images && restaurant.images.length > 0 && (
                    <div className='shrink-0'>
                      <div className='relative w-40 h-40 bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden'>
                        <Image
                          src={restaurant.images[0]}
                          alt={restaurant.name}
                          width={160}
                          height={160}
                          className='w-full h-full object-cover'
                          onError={() => {
                            console.warn(
                              `Failed to load restaurant image: ${restaurant.images?.[0]}`
                            );
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {restaurant.description && (
                  <div>
                    <p className='text-sm font-semibold mb-2 text-gray-900 dark:text-white'>
                      About:
                    </p>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      {restaurant.description}
                    </p>
                  </div>
                )}

                {/* Working Hours */}
                {restaurant.workingHours && restaurant.workingHours.length > 0 && (
                  <div>
                    <div className='flex items-center gap-2 mb-3'>
                      <Clock className='w-5 h-5 text-gray-600 dark:text-gray-400' />
                      <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                        Working Hours:
                      </p>
                    </div>
                    <div className='grid grid-cols-2 gap-2 text-sm'>
                      {restaurant.workingHours.map((hours) => (
                        <div key={hours.day} className='flex justify-between'>
                          <span className='font-medium text-gray-900 dark:text-white'>
                            {formatDay(hours.day)}:
                          </span>
                          <span className='text-gray-600 dark:text-gray-400'>
                            {hours.isClosed ? 'Closed' : `${hours.openTime} - ${hours.closeTime}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {restaurantShareUrl && (
                  <ShareActions
                    url={restaurantShareUrl}
                    title={`Check out this restaurant: ${restaurant.name}`}
                    className='rounded-md border border-gray-200 dark:border-slate-700 p-3'
                  />
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuItemModal;
