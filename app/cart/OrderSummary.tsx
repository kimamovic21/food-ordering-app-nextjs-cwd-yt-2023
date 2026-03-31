import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface OrderSummaryProps {
  subtotal: number;
  includedTax: number;
  taxPercentage: number;
  deliveryFee: number;
  loyaltyDiscountPercentage: number;
  loyaltyDiscount: number;
  isLoggedIn: boolean;
  isSubmitting: boolean;
  handleCheckout: () => void;
  restaurantsOpen: boolean;
  loadingRestaurants: boolean;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  subtotal,
  includedTax,
  taxPercentage,
  deliveryFee,
  loyaltyDiscountPercentage,
  loyaltyDiscount,
  isLoggedIn,
  isSubmitting,
  handleCheckout,
  restaurantsOpen,
  loadingRestaurants,
}) => {
  const finalDeliveryFee = deliveryFee - loyaltyDiscount;
  const total = subtotal + finalDeliveryFee;

  return (
    <div className='bg-card border rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4'>
      <h3 className='text-lg font-bold text-foreground'>Order Summary</h3>
      <div className='space-y-2 border-b pb-3'>
        {loadingRestaurants && (
          <div className='text-sm text-muted-foreground text-center py-2'>
            Loading restaurant information...
          </div>
        )}
        <div className='flex justify-between text-muted-foreground text-sm sm:text-base'>
          <span className='font-semibold'>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className='flex justify-between text-muted-foreground text-sm sm:text-base'>
          <span className='font-semibold'>Included Tax ({taxPercentage}%):</span>
          <span>${includedTax.toFixed(2)}</span>
        </div>
      </div>
      <div className='space-y-2 border-b pb-3'>
        <div className='flex justify-between text-muted-foreground text-sm sm:text-base'>
          <span className='font-semibold'>Delivery Fee:</span>
          <span>${deliveryFee.toFixed(2)}</span>
        </div>
        {loyaltyDiscountPercentage > 0 && (
          <div className='flex justify-between text-green-600 text-sm sm:text-base pl-2'>
            <span>- Loyalty Discount ({loyaltyDiscountPercentage}%):</span>
            <span>- ${loyaltyDiscount.toFixed(2)}</span>
          </div>
        )}
        {loyaltyDiscountPercentage > 0 && (
          <div className='flex justify-between text-muted-foreground text-sm sm:text-base font-semibold border-t border-dashed pt-1'>
            <span>Final Delivery Fee:</span>
            <span>${finalDeliveryFee.toFixed(2)}</span>
          </div>
        )}
      </div>
      <div className='border-t pt-3'>
        <div className='flex justify-between text-lg sm:text-xl font-bold text-foreground'>
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
        {loyaltyDiscountPercentage > 0 && (
          <div className='mt-2 text-xs text-center text-green-600'>
            🎉 You saved ${loyaltyDiscount.toFixed(2)} on delivery with loyalty rewards!
          </div>
        )}
        {isLoggedIn && loyaltyDiscountPercentage === 0 && (
          <div className='mt-2 text-xs text-center text-muted-foreground'>
            Complete your first order to unlock loyalty rewards!{' '}
            <Link href='/loyalty' className='text-primary underline'>
              Learn more
            </Link>
          </div>
        )}
      </div>
      {isLoggedIn ? (
        <Button
          onClick={handleCheckout}
          disabled={isSubmitting || !restaurantsOpen || loadingRestaurants}
          aria-busy={isSubmitting}
          size='lg'
          className='w-full rounded-full flex items-center justify-center'
        >
          {isSubmitting ? (
            <>
              <Loader2 className='animate-spin mr-2 h-5 w-5' />
              Redirecting...
            </>
          ) : !restaurantsOpen ? (
            'Restaurant Closed'
          ) : (
            'Proceed to Checkout'
          )}
        </Button>
      ) : (
        <Button disabled variant='outline' size='lg' className='w-full rounded-full'>
          Sign in to continue with payment
        </Button>
      )}
    </div>
  );
};

export default OrderSummary;
