import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface OrderSummaryProps {
  subtotal: number;
  deliveryFee: number;
  loyaltyDiscountPercentage: number;
  loyaltyDiscount: number;
  weatherAdjustment: number;
  isLoggedIn: boolean;
  isSubmitting: boolean;
  handleCheckout: () => void;
  calculatingFee: boolean;
  disableOnClick?: boolean;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  subtotal,
  deliveryFee,
  loyaltyDiscountPercentage,
  loyaltyDiscount,
  weatherAdjustment,
  isLoggedIn,
  isSubmitting,
  handleCheckout,
  calculatingFee,
  disableOnClick = true,
}) => {
  const [clicked, setClicked] = useState(false);
  const tax = subtotal * 0.1;
  const finalDeliveryFee = deliveryFee - loyaltyDiscount;
  const total = subtotal + tax + finalDeliveryFee;

  return (
    <div className='bg-card border rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4'>
      <h3 className='text-lg font-bold text-foreground'>Order Summary</h3>
      <div className='space-y-2 border-b pb-3'>
        {calculatingFee && (
          <div className='text-sm text-muted-foreground text-center py-2'>
            Calculating delivery fee...
          </div>
        )}
        <div className='flex justify-between text-muted-foreground text-sm sm:text-base'>
          <span className='font-semibold'>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className='flex justify-between text-muted-foreground text-sm sm:text-base'>
          <span className='font-semibold'>Tax (10%):</span>
          <span>${tax.toFixed(2)}</span>
        </div>
      </div>
      <div className='space-y-2 border-b pb-3'>
        <div className='flex justify-between text-muted-foreground text-sm sm:text-base'>
          <span className='font-semibold'>Base Delivery Fee:</span>
          <span>${deliveryFee.toFixed(2)}</span>
        </div>
        {loyaltyDiscountPercentage > 0 && (
          <div className='flex justify-between text-green-600 text-sm sm:text-base pl-2'>
            <span>- Loyalty Discount ({loyaltyDiscountPercentage}%):</span>
            <span>- ${loyaltyDiscount.toFixed(2)}</span>
          </div>
        )}
        {weatherAdjustment > 0 && (
          <div className='text-xs text-muted-foreground italic pl-2'>
            Includes weather surcharge (+${weatherAdjustment.toFixed(2)})
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
          onClick={() => {
            if (disableOnClick) setClicked(true);
            handleCheckout();
          }}
          disabled={isSubmitting || (disableOnClick && clicked)}
          aria-busy={isSubmitting}
          size='lg'
          className={`w-full rounded-full flex items-center justify-center ${isSubmitting || (disableOnClick && clicked) ? 'opacity-70 pointer-events-none' : ''}`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className='animate-spin mr-2 h-5 w-5' />
              Redirecting...
            </>
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
