'use client';

import { FaPlus, FaMinus, FaTrash } from 'react-icons/fa';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
import Image from 'next/image';
import Pizza from '@/public/pizza.png';

interface CartItem {
  _id: string;
  name: string;
  size: string;
  price: number | null;
  quantity: number;
  image?: string;
}

interface CartItemsProps {
  cartItems: CartItem[];
  updateQuantity: (id: string, size: string, quantity: number) => void;
  removeFromCart: (id: string, size: string) => void;
  clearCart: () => void;
  validationItems?: CartValidationItem[];
}

type CartValidationItem = {
  itemKey: string;
  status: 'valid' | 'unavailable' | 'deleted' | 'invalid_size' | 'invalid';
  name?: string;
  image?: string | null;
  price?: number;
  previousPrice?: number | null;
  priceChanged?: boolean;
  message?: string | null;
};

const getCartItemKey = (item: CartItem) => `${item._id}:${item.size}`;

const CartItems: React.FC<CartItemsProps> = ({
  cartItems,
  updateQuantity,
  removeFromCart,
  clearCart,
  validationItems = [],
}) => {
  const validationByKey = new Map(validationItems.map((item) => [item.itemKey, item]));

  // Helper to show toast
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    sonnerToast[type](message, { duration: 2000 });
  };

  // Wrap updateQuantity to show toast
  const handleUpdateQuantity = (
    id: string,
    size: string,
    quantity: number,
    action: 'add' | 'remove'
  ) => {
    try {
      updateQuantity(id, size, quantity);
      if (action === 'add') {
        showToast('Item successfully added to cart', 'success');
      } else {
        showToast('Item successfully removed from cart', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Something went wrong', 'error');
    }
  };

  // Wrap removeFromCart to show toast
  const handleRemoveFromCart = (id: string, size: string) => {
    try {
      removeFromCart(id, size);
      showToast('Item successfully removed from cart', 'success');
    } catch (err) {
      console.error(err);
      showToast('Something went wrong', 'error');
    }
  };

  // Wrap clearCart to show toast
  const handleClearCart = () => {
    try {
      clearCart();
      showToast('All items successfully removed from the cart', 'success');
    } catch (err) {
      console.error(err);
      showToast('Something went wrong', 'error');
    }
  };

  return (
    <>
      <div className='space-y-4 mb-6 sm:mb-8'>
        {cartItems.map((item) => {
          const validation = validationByKey.get(getCartItemKey(item));
          const isUnavailable = validation ? validation.status !== 'valid' : false;
          const displayName = validation?.name || item.name;
          const displayPrice =
            validation?.status === 'valid' &&
            typeof validation.price === 'number' &&
            Number.isFinite(validation.price)
              ? validation.price
              : item.price;
          const safeImageSrc = validation?.image || item.image || Pizza;
          const isRemoteImage =
            typeof safeImageSrc === 'string' &&
            (safeImageSrc.startsWith('http') || safeImageSrc.includes('cloudinary'));
          const itemPrice =
            typeof displayPrice === 'number' && Number.isFinite(displayPrice) ? displayPrice : 0;
          const isValidImageUrl = typeof safeImageSrc === 'string' && safeImageSrc.length > 0;
          return (
            <div
              key={`${item._id}-${item.size}`}
              className='bg-card border rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4'
            >
              <div className='flex items-start gap-3 w-full sm:w-auto'>
                <div className='relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 overflow-hidden rounded'>
                  {isValidImageUrl ? (
                    isRemoteImage ? (
                      <Image
                        width={80}
                        height={80}
                        src={safeImageSrc}
                        alt={displayName}
                        className='w-full h-full object-contain rounded'
                        onError={() => {
                          console.warn(`Failed to load image: ${safeImageSrc}`);
                        }}
                      />
                    ) : (
                      <Image
                        src={safeImageSrc}
                        alt={displayName}
                        width={80}
                        height={80}
                        className='w-full h-full object-contain rounded'
                        onError={() => {
                          console.warn(`Failed to load image: ${safeImageSrc}`);
                        }}
                      />
                    )
                  ) : (
                    <Image
                      width={80}
                      height={80}
                      src={Pizza}
                      alt={displayName}
                      className='w-full h-full object-contain rounded'
                    />
                  )}
                  {isUnavailable && (
                    <div className='absolute inset-0 flex items-center justify-center bg-black/65 text-[10px] font-semibold uppercase text-white'>
                      Unavailable
                    </div>
                  )}
                </div>
                <div className='grow min-w-0'>
                  <h3 className='text-base sm:text-lg font-semibold text-foreground truncate'>
                    {displayName}
                  </h3>
                  {item.size !== 'single' && (
                    <p className='text-xs sm:text-sm text-muted-foreground capitalize'>
                      Size: {item.size}
                    </p>
                  )}
                  <p className='text-xs sm:text-sm font-semibold text-primary mt-1'>
                    ${itemPrice.toFixed(2)} each
                  </p>
                  {isUnavailable && (
                    <p className='mt-1 text-xs font-medium text-red-600'>
                      {validation?.message || 'This item cannot be ordered right now.'}
                    </p>
                  )}
                  {validation?.status === 'valid' && validation.priceChanged && (
                    <p className='mt-1 text-xs font-medium text-amber-600'>
                      Price updated
                      {typeof validation.previousPrice === 'number'
                        ? ` from $${validation.previousPrice.toFixed(2)}`
                        : ''}{' '}
                      to ${itemPrice.toFixed(2)}.
                    </p>
                  )}
                </div>
              </div>
              <div className='flex items-center gap-2 sm:gap-3 ml-auto'>
                <FaMinus
                  size={20}
                  onClick={() =>
                    handleUpdateQuantity(item._id, item.size, item.quantity - 1, 'remove')
                  }
                  className='bg-accent hover:bg-accent/80 rounded-full p-1.5 sm:p-2 lg:p-1.5 transition cursor-pointer text-foreground w-8 h-8 sm:w-8 sm:h-8 lg:w-6 lg:h-6 inline-flex items-center justify-center'
                  role='button'
                  tabIndex={0}
                  aria-label='Decrease quantity'
                />
                <span className='font-semibold text-base sm:text-lg w-6 sm:w-8 text-center'>
                  {item.quantity}
                </span>
                <FaPlus
                  size={20}
                  onClick={() => {
                    if (!isUnavailable) {
                      handleUpdateQuantity(item._id, item.size, item.quantity + 1, 'add');
                    }
                  }}
                  className={`bg-accent rounded-full p-1.5 sm:p-2 lg:p-1.5 transition text-foreground w-8 h-8 sm:w-8 sm:h-8 lg:w-6 lg:h-6 inline-flex items-center justify-center ${
                    isUnavailable
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer hover:bg-accent/80'
                  }`}
                  role='button'
                  tabIndex={0}
                  aria-label='Increase quantity'
                  aria-disabled={isUnavailable}
                />
                <div className='text-right ml-2 sm:ml-3'>
                  <p className='font-bold text-base sm:text-lg text-foreground whitespace-nowrap'>
                    ${(itemPrice * item.quantity).toFixed(2)}
                  </p>
                </div>
                <FaTrash
                  size={16}
                  onClick={() => handleRemoveFromCart(item._id, item.size)}
                  className='text-destructive hover:opacity-90 transition cursor-pointer ml-1'
                  role='button'
                  tabIndex={0}
                  aria-label='Remove item'
                />
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={handleClearCart}
        className='w-full bg-red-500 text-white py-2 rounded flex items-center justify-center gap-2'
      >
        <FaTrash className='size-4' /> Clear Cart
      </button>
    </>
  );
};

export default CartItems;
