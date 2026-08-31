'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Clock, Globe, Mail, MapPin, Phone, ShoppingCart } from 'lucide-react';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import FavoriteToggleButton from '@/components/shared/FavoriteToggleButton';
import HeartRating from '@/components/shared/HeartRating';
import ShareActions from '@/components/shared/ShareActions';
import { useCart } from '@/contexts/CartContext';
import useFavorites from '@/hooks/useFavorites';
import useProfile from '@/hooks/useProfile';
import Pizza from '@/public/pizza.png';
import MenuItemDetailLoading from './loading';
import type { CartSize } from '@/types/cart';
import type { MenuItemListItem } from '@/types/menu';
import type { RestaurantPublicDetails } from '@/types/restaurant';

const formatDay = (day: string) => day.charAt(0).toUpperCase() + day.slice(1);

const normalizeId = (value: unknown): string => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && '_id' in (value as Record<string, unknown>)) {
    return String((value as Record<string, unknown>)._id || '');
  }
  return String(value);
};

const getCategoryName = (category: MenuItemListItem['category']) => {
  if (!category) return 'Menu item';
  return typeof category === 'string' ? category : category.name;
};

const MenuItemDetailPage = () => {
  const params = useParams<{ itemId: string }>();
  const itemId = params?.itemId;
  const [item, setItem] = useState<MenuItemListItem | null>(null);
  const [restaurant, setRestaurant] = useState<RestaurantPublicDetails | null>(null);
  const [isItemLoading, setIsItemLoading] = useState(true);
  const [isRestaurantLoading, setIsRestaurantLoading] = useState(false);
  const [userSelectedSize, setUserSelectedSize] = useState<CartSize>('small');
  const [shareUrl, setShareUrl] = useState('');
  const { addToCart, getCartRestaurantId } = useCart();
  const { data: profileData, loading: profileLoading } = useProfile();
  const { data: favorites, setMenuItemFavorite, setRestaurantFavorite } = useFavorites();

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (!itemId) return;

    const controller = new AbortController();

    const fetchItem = async () => {
      setIsItemLoading(true);
      setRestaurant(null);

      try {
        const response = await fetch(`/api/menu-items?_id=${itemId}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        const nextItem = Array.isArray(data) ? data[0] : data?.item || null;
        setItem(nextItem);
      } catch (error) {
        if (!(error instanceof DOMException)) {
          console.error('Error fetching menu item:', error);
        }
        setItem(null);
      } finally {
        setIsItemLoading(false);
      }
    };

    fetchItem();

    return () => controller.abort();
  }, [itemId]);

  useEffect(() => {
    if (!item?.restaurantId) return;

    const controller = new AbortController();

    const fetchRestaurant = async () => {
      setIsRestaurantLoading(true);

      try {
        const response = await fetch(`/api/restaurant/${item.restaurantId}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        setRestaurant(data?.restaurant || null);
      } catch (error) {
        if (!(error instanceof DOMException)) {
          console.error('Error fetching restaurant:', error);
        }
        setRestaurant(null);
      } finally {
        setIsRestaurantLoading(false);
      }
    };

    fetchRestaurant();

    return () => controller.abort();
  }, [item?.restaurantId]);

  const availableSizes = useMemo(() => {
    if (!item) return [];

    return (['small', 'medium', 'large'] as CartSize[])
      .map((size) => {
        const value =
          size === 'small'
            ? item.priceSmall
            : size === 'medium'
              ? item.priceMedium
              : item.priceLarge;
        return { size, value };
      })
      .filter((entry) => typeof entry.value === 'number' && Number.isFinite(entry.value));
  }, [item]);

  const effectiveSelectedSize: CartSize = useMemo(() => {
    if (availableSizes.length === 1) return 'single';
    if (availableSizes.some((entry) => entry.size === userSelectedSize)) return userSelectedSize;
    return availableSizes[0]?.size ?? 'small';
  }, [availableSizes, userSelectedSize]);

  const selectedPrice = useMemo(() => {
    if (effectiveSelectedSize === 'single') {
      return availableSizes[0]?.value ?? null;
    }

    return availableSizes.find((entry) => entry.size === effectiveSelectedSize)?.value ?? null;
  }, [availableSizes, effectiveSelectedSize]);

  const imageUrl = item?.image || Pizza.src;
  const shareBaseUrl = shareUrl ? new URL(shareUrl).origin : '';
  const itemShareUrl = shareUrl || (item ? `/menu/${item._id}` : '');
  const restaurantShareUrl =
    restaurant && shareBaseUrl ? `${shareBaseUrl}/restaurants/${restaurant._id}` : '';
  const categoryName = getCategoryName(item?.category);
  const isAvailable = item?.isAvailable !== false;

  const handleAddToCart = () => {
    if (!item || profileLoading) {
      return;
    }

    if (!isAvailable) {
      sonnerToast.error(`${item.name} is currently unavailable`);
      return;
    }

    const cartRestaurantId = getCartRestaurantId();
    const currentUserId = normalizeId(profileData?._id);
    const currentUserRestaurantId = normalizeId(profileData?.restaurantId);
    const itemAdminId = normalizeId(item.adminId);
    const itemRestaurantId = normalizeId(item.restaurantId);

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

    if (selectedPrice == null) return;

    addToCart({
      _id: item._id,
      name: item.name,
      description: item.description,
      image: item.image,
      size: availableSizes.length === 1 ? 'single' : effectiveSelectedSize,
      price: selectedPrice,
      restaurantId: itemRestaurantId,
    });

    sonnerToast.success(
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
  };

  if (isItemLoading) {
    return <MenuItemDetailLoading />;
  }

  if (!item) {
    return (
      <main className='mx-auto max-w-3xl px-4 py-12'>
        <Breadcrumb className='mb-8'>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href='/menu'>Menu</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Not found</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card className='p-8 text-center'>
          <h1 className='text-3xl font-bold'>Menu item not found</h1>
          <p className='mt-3 text-muted-foreground'>
            This item may have been removed or the link is no longer available.
          </p>
          <Button asChild className='mt-6'>
            <Link href='/menu'>Back to menu</Link>
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className='mx-auto max-w-7xl px-4 py-8 sm:py-10 lg:py-12'>
      <Breadcrumb className='mb-6'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href='/menu'>Menu</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{item.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className='grid gap-6 md:grid-cols-[minmax(0,1fr)_22rem] lg:grid-cols-[minmax(0,1.25fr)_24rem] xl:grid-cols-[minmax(0,1.35fr)_27rem]'>
        <Card className='self-start overflow-hidden p-0'>
          <div className='relative flex aspect-[4/3] min-h-[17rem] items-center justify-center overflow-hidden bg-muted sm:min-h-[21rem] md:aspect-auto md:h-[32rem] lg:h-[35rem] xl:h-[36rem]'>
            {item.image ? (
              <Image
                src={imageUrl}
                alt={item.name}
                width={760}
                height={760}
                priority
                className='h-full w-full object-cover'
                onError={() => {
                  console.warn(`Failed to load image: ${item.image}`);
                }}
              />
            ) : (
              <div className='text-sm text-muted-foreground'>No image available</div>
            )}
            {!isAvailable && (
              <div className='absolute inset-0 flex items-center justify-center bg-black/65 text-white'>
                <span className='rounded-full border border-white/40 bg-black/40 px-5 py-2 text-sm font-semibold'>
                  Currently unavailable
                </span>
              </div>
            )}
          </div>
        </Card>

        <div className='space-y-6'>
          <Card className='p-5 sm:p-6'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <Badge variant='secondary' className='capitalize'>
                {categoryName}
              </Badge>
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
              <FavoriteToggleButton
                type='menu-item'
                targetId={item._id}
                isFavorite={favorites.favoriteMenuItemIds.includes(item._id)}
                onChanged={(nextIsFavorite) => setMenuItemFavorite(item._id, nextIsFavorite)}
                showLabel
              />
            </div>

            <h1 className='mt-4 text-3xl font-bold tracking-normal sm:text-4xl'>{item.name}</h1>
            <div className='mt-3'>
              <HeartRating
                rating={item.restaurantAverageRating ?? restaurant?.averageRating ?? 0}
                ratingCount={item.restaurantRatingCount ?? restaurant?.ratingCount ?? 0}
              />
            </div>
            <p className='mt-5 text-base leading-relaxed text-muted-foreground'>
              {item.description}
            </p>
          </Card>

          <Card className='p-5 sm:p-6'>
            <div className='flex items-end justify-between gap-4'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>Price</p>
                <p className='text-3xl font-bold'>
                  ${selectedPrice == null ? '0.00' : selectedPrice.toFixed(2)}
                </p>
              </div>
              {availableSizes.length === 1 && (
                <Badge variant='outline' className='capitalize'>
                  Single size
                </Badge>
              )}
            </div>

            {availableSizes.length > 1 && (
              <div className='mt-6 space-y-3'>
                <p className='text-sm font-semibold'>Choose size</p>
                <div className='grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3'>
                  {availableSizes.map((entry) => (
                    <Button
                      key={entry.size}
                      type='button'
                      variant={effectiveSelectedSize === entry.size ? 'default' : 'outline'}
                      className='h-auto justify-between gap-3 px-4 py-3 capitalize'
                      onClick={() => setUserSelectedSize(entry.size)}
                    >
                      <span>{entry.size}</span>
                      <span>${entry.value?.toFixed(2)}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleAddToCart}
              disabled={!isAvailable || selectedPrice == null}
              className='mt-6 w-full'
              size='lg'
            >
              <ShoppingCart className='h-4 w-4' />
              {isAvailable ? 'Add to cart' : 'Unavailable'}
            </Button>
          </Card>

          <Card className='p-5 sm:p-6'>
            <ShareActions
              url={itemShareUrl}
              title={`Check out this meal: ${item.name}`}
              label='Share this menu item with friends'
              className='space-y-0'
            />
          </Card>
        </div>
      </section>

      <section className='mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_22rem] lg:grid-cols-[minmax(0,1.25fr)_24rem] xl:grid-cols-[minmax(0,1.35fr)_27rem]'>
        <Card className='p-5 sm:p-6'>
          {isRestaurantLoading ? (
            <div className='space-y-4'>
              <Skeleton className='h-8 w-56' />
              <Skeleton className='h-20 w-full' />
              <Skeleton className='h-32 w-full' />
            </div>
          ) : restaurant ? (
            <div className='grid gap-6 md:grid-cols-[12rem_minmax(0,1fr)]'>
              {restaurant.images?.[0] ? (
                <div className='relative h-48 overflow-hidden rounded-lg bg-muted md:h-full'>
                  <Image
                    src={restaurant.images[0]}
                    alt={restaurant.name}
                    width={320}
                    height={320}
                    className='h-full w-full object-cover'
                    onError={() => {
                      console.warn(`Failed to load restaurant image: ${restaurant.images?.[0]}`);
                    }}
                  />
                </div>
              ) : (
                <div className='flex h-48 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground md:h-full'>
                  No restaurant image
                </div>
              )}

              <div className='space-y-5'>
                <div className='flex flex-wrap items-start justify-between gap-3'>
                  <div>
                    <div className='flex flex-wrap items-center gap-2'>
                      <h2 className='text-2xl font-bold'>{restaurant.name}</h2>
                      {typeof restaurant.isOpen === 'boolean' && (
                        <Badge variant={restaurant.isOpen ? 'default' : 'secondary'}>
                          {restaurant.isOpen ? 'Open' : 'Closed'}
                        </Badge>
                      )}
                    </div>
                    <div className='mt-2'>
                      <HeartRating
                        rating={restaurant.averageRating ?? item.restaurantAverageRating ?? 0}
                        ratingCount={restaurant.ratingCount ?? item.restaurantRatingCount ?? 0}
                      />
                    </div>
                  </div>

                  <FavoriteToggleButton
                    type='restaurant'
                    targetId={restaurant._id}
                    isFavorite={favorites.favoriteRestaurantIds.includes(restaurant._id)}
                    onChanged={(nextIsFavorite) =>
                      setRestaurantFavorite(restaurant._id, nextIsFavorite)
                    }
                  />
                </div>

                {restaurant.description && (
                  <p className='leading-relaxed text-muted-foreground'>{restaurant.description}</p>
                )}

                <div className='grid gap-3 text-sm sm:grid-cols-2'>
                  {(restaurant.street || restaurant.city) && (
                    <div className='flex items-start gap-2'>
                      <MapPin className='mt-0.5 h-4 w-4 shrink-0 text-muted-foreground' />
                      <span>
                        {[
                          restaurant.street,
                          restaurant.city,
                          restaurant.postalCode,
                          restaurant.country,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                  {restaurant.contact && (
                    <div className='flex items-start gap-2'>
                      <Phone className='mt-0.5 h-4 w-4 shrink-0 text-muted-foreground' />
                      <span>{restaurant.contact}</span>
                    </div>
                  )}
                  {restaurant.email && (
                    <div className='flex items-start gap-2'>
                      <Mail className='mt-0.5 h-4 w-4 shrink-0 text-muted-foreground' />
                      <a href={`mailto:${restaurant.email}`} className='break-all hover:underline'>
                        {restaurant.email}
                      </a>
                    </div>
                  )}
                  {restaurant.webAddress && (
                    <div className='flex items-start gap-2'>
                      <Globe className='mt-0.5 h-4 w-4 shrink-0 text-muted-foreground' />
                      <a
                        href={restaurant.webAddress}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='break-all hover:underline'
                      >
                        {restaurant.webAddress}
                      </a>
                    </div>
                  )}
                </div>

                <div className='flex flex-wrap gap-3'>
                  <Button asChild>
                    <Link href={`/restaurants/${restaurant._id}`}>See restaurant details</Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className='text-muted-foreground'>Restaurant details are not available.</p>
          )}
        </Card>

        <Card className='p-5 sm:p-6'>
          <div className='flex items-center gap-2'>
            <Clock className='h-5 w-5 text-muted-foreground' />
            <h2 className='text-xl font-semibold'>Working hours</h2>
          </div>

          {restaurant?.workingHours?.length ? (
            <div className='mt-5 space-y-2 text-sm'>
              {restaurant.workingHours.map((hours) => (
                <div key={hours.day} className='flex items-center justify-between gap-4'>
                  <span className='font-medium'>{formatDay(hours.day)}</span>
                  <span className='text-right text-muted-foreground'>
                    {hours.isClosed ? 'Closed' : `${hours.openTime} - ${hours.closeTime}`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className='mt-4 text-sm text-muted-foreground'>Working hours are not available.</p>
          )}

          {restaurantShareUrl && (
            <ShareActions
              url={restaurantShareUrl}
              title={`Check out this restaurant: ${restaurant?.name}`}
              label='Share this restaurant with friends'
              className='mt-6 border-t pt-5'
            />
          )}
        </Card>
      </section>
    </main>
  );
};

export default MenuItemDetailPage;
