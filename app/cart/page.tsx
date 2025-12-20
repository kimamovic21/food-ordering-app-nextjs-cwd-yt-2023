'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { FaPlus, FaMinus, FaTrash } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import Pizza from '@/public/pizza.png';
import useProfile from '@/contexts/UseProfile';

const CartPage = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    getTotalPrice,
    clearCart
  } = useCart();

  const { data: profileData } = useProfile();
  const { status: sessionStatus } = useSession();
  const isLoggedIn = sessionStatus === 'authenticated';

  const [formData, setFormData] = useState({
    phone: '',
    streetAddress: '',
    postalCode: '',
    city: '',
    country: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profileData) {
      setFormData({
        phone: profileData.phone || '',
        streetAddress: profileData.streetAddress || '',
        postalCode: profileData.postalCode || '',
        city: profileData.city || '',
        country: profileData.country || '',
      });
    }
  }, [profileData]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async () => {
    if (!isLoggedIn) {
      toast.error('Please sign in to proceed to checkout.');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }

    const missingField = Object.entries(formData).find(([, value]) => !value);
    if (missingField) {
      toast.error('Please complete your delivery details.');
      return;
    }

    if (!profileData?.email) {
      toast.error('We could not find your email. Please re-login.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          cartItems,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to start checkout.');
      }

      const data = await response.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Checkout URL missing.');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Unable to proceed to checkout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className='text-center py-16'>
        <h2 className='text-4xl font-bold text-gray-700 mb-4'>
          Your Cart is Empty
        </h2>

        <p className='text-gray-500 mb-8'>
          Add some delicious items to your cart!
        </p>

        <Link
          href='/menu'
          className='bg-primary text-white px-8 py-3 rounded-full hover:bg-orange-700 inline-block'
        >
          Browse Menu
        </Link>
      </div>
    );
  };

  return (
    <div className='max-w-7xl mx-auto py-4 sm:py-8 px-2 sm:px-4'>
      <div className='flex justify-between items-center mb-6 sm:mb-8'>
        <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold text-gray-700'>
          Shopping Cart
        </h2>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2'>
          <div className='space-y-4 mb-6 sm:mb-8'>
            {cartItems.map((item) => {
              const imageUrl = item.image || Pizza.src;
              const isRemoteImage = typeof imageUrl === 'string' && (imageUrl.startsWith('http') || imageUrl.includes('cloudinary'));

              return (
                <div
                  key={`${item._id}-${item.size}`}
                  className='bg-white rounded-lg shadow-md p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4'
                >
                  <div className='flex items-start gap-3 w-full sm:w-auto'>
                    <div className='w-16 h-16 sm:w-20 sm:h-20 shrink-0'>
                      {isRemoteImage ? (
                        <img
                          src={imageUrl}
                          alt={item.name}
                          className='w-full h-full object-contain rounded'
                        />
                      ) : (
                        <Image
                          src={imageUrl}
                          alt={item.name}
                          width={80}
                          height={80}
                          className='w-full h-full object-contain rounded'
                        />
                      )}
                    </div>

                    <div className='grow min-w-0'>
                      <h3 className='text-base sm:text-lg font-semibold text-gray-800 truncate'>
                        {item.name}
                      </h3>
                      <p className='text-xs sm:text-sm text-gray-500 capitalize'>
                        Size: {item.size}
                      </p>
                      <p className='text-xs sm:text-sm font-semibold text-primary mt-1'>
                        ${item.price.toFixed(2)} each
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center w-full gap-3 sm:gap-4'>
                    <div className='flex items-center gap-2 sm:gap-3'>
                      <FaMinus
                        size={20}
                        onClick={() => updateQuantity(item._id, item.size, item.quantity - 1)}
                        className='bg-gray-200 hover:bg-gray-300 rounded-full p-1.5 sm:p-2 lg:p-1.5 transition cursor-pointer text-gray-700 w-8 h-8 sm:w-8 sm:h-8 lg:w-6 lg:h-6 inline-flex items-center justify-center'
                        role='button'
                        tabIndex={0}
                        aria-label='Decrease quantity'
                      />

                      <span className='font-semibold text-base sm:text-lg w-6 sm:w-8 text-center'>
                        {item.quantity}
                      </span>

                      <FaPlus
                        size={20}
                        onClick={() => updateQuantity(item._id, item.size, item.quantity + 1)}
                        className='bg-gray-200 hover:bg-gray-300 rounded-full p-1.5 sm:p-2 lg:p-1.5 transition cursor-pointer text-gray-700 w-8 h-8 sm:w-8 sm:h-8 lg:w-6 lg:h-6 inline-flex items-center justify-center'
                        role='button'
                        tabIndex={0}
                        aria-label='Increase quantity'
                      />
                    </div>

                    <div className='flex items-center gap-3 ml-auto'>
                      <div className='text-right'>
                        <p className='font-bold text-base sm:text-lg text-gray-800 whitespace-nowrap'>
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      <FaTrash
                        size={16}
                        onClick={() => removeFromCart(item._id, item.size)}
                        className='text-red-600 hover:text-red-800 transition cursor-pointer'
                        role='button'
                        tabIndex={0}
                        aria-label='Remove item'
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={clearCart}
            className='bg-red-600 hover:bg-red-700 transition text-xs sm:text-sm font-semibold flex items-center gap-2 text-white'
            aria-label='Clear cart'
          >
            <FaTrash size={14} />
            Clear Cart
          </button>
        </div>

        <div className='lg:col-span-1 space-y-4'>
          <div className='bg-gray-100 rounded-lg p-4 sm:p-6 space-y-2 sm:space-y-3'>
            <h3 className='text-lg font-bold text-gray-900 mb-4'>Order Summary</h3>
            <div className='flex justify-between text-gray-700 text-sm sm:text-base'>
              <span className='font-semibold'>Subtotal:</span>
              <span>${getTotalPrice().toFixed(2)}</span>
            </div>
            <div className='flex justify-between text-gray-700 text-sm sm:text-base'>
              <span className='font-semibold'>Tax (10%):</span>
              <span>${(getTotalPrice() * 0.1).toFixed(2)}</span>
            </div>
            <div className='flex justify-between text-gray-700 text-sm sm:text-base'>
              <span className='font-semibold'>Delivery Fee:</span>
              <span>$5.00</span>
            </div>
            <div className='border-t border-gray-300 pt-2 sm:pt-3 mt-2 sm:mt-3'>
              <div className='flex justify-between text-lg sm:text-xl font-bold text-gray-900'>
                <span>Total:</span>
                <span>${(getTotalPrice() * 1.1 + 5).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-md p-4 sm:p-6 lg:max-h-[70vh] lg:overflow-y-auto'>
            <h3 className='text-lg font-bold text-gray-900 mb-4'>Delivery Information</h3>

            <div className='mb-4'>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>
                Email
              </label>
              <input
                type='email'
                value={profileData?.email || ''}
                disabled
                className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed'
              />
            </div>

            <div className='mb-4'>
              <label htmlFor='phone' className='block text-sm font-semibold text-gray-700 mb-2'>
                Phone
              </label>
              <input
                type='tel'
                id='phone'
                name='phone'
                value={formData.phone}
                onChange={handleInputChange}
                placeholder='Your phone number'
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
              />
            </div>

            <div className='mb-4'>
              <label htmlFor='streetAddress' className='block text-sm font-semibold text-gray-700 mb-2'>
                Street Address
              </label>
              <input
                type='text'
                id='streetAddress'
                name='streetAddress'
                value={formData.streetAddress}
                onChange={handleInputChange}
                placeholder='Your street address'
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
              />
            </div>

            <div className='mb-4'>
              <label htmlFor='postalCode' className='block text-sm font-semibold text-gray-700 mb-2'>
                Postal Code
              </label>
              <input
                type='text'
                id='postalCode'
                name='postalCode'
                value={formData.postalCode}
                onChange={handleInputChange}
                placeholder='Your postal code'
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
              />
            </div>

            <div className='mb-4'>
              <label htmlFor='city' className='block text-sm font-semibold text-gray-700 mb-2'>
                City
              </label>
              <input
                type='text'
                id='city'
                name='city'
                value={formData.city}
                onChange={handleInputChange}
                placeholder='Your city'
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
              />
            </div>

            <div className='mb-6'>
              <label htmlFor='country' className='block text-sm font-semibold text-gray-700 mb-2'>
                Country
              </label>
              <input
                type='text'
                id='country'
                name='country'
                value={formData.country}
                onChange={handleInputChange}
                placeholder='Your country'
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
              />
            </div>
          </div>

          {isLoggedIn ? (
            <button
              onClick={handleCheckout}
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className='w-full bg-primary text-white py-2.5 sm:py-3 rounded-full font-semibold text-base sm:text-lg hover:bg-orange-700 transition disabled:opacity-70 disabled:cursor-not-allowed'
            >
              {isSubmitting ? 'Redirecting...' : 'Proceed to Checkout'}
            </button>
          ) : (
            <button disabled className='w-full bg-gray-400 text-white py-2.5 sm:py-3 rounded-full font-semibold text-base sm:text-lg cursor-not-allowed'>
              Sign in to continue with payment
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartPage;
