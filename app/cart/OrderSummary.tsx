import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface OrderSummaryProps {
  subtotal: number;
  includedTax: number;
  taxPercentage: number;
  deliveryFee: number;
  loyaltyDiscountPercentage: number;
  loyaltyDiscount: number;
  couponCode: string;
  couponDiscount: number;
  couponMessage: string | null;
  couponError: string | null;
  isApplyingCoupon: boolean;
  onCouponCodeChange: (value: string) => void;
  onApplyCoupon: () => void;
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
  couponCode,
  couponDiscount,
  couponMessage,
  couponError,
  isApplyingCoupon,
  onCouponCodeChange,
  onApplyCoupon,
  isLoggedIn,
  isSubmitting,
  handleCheckout,
  restaurantsOpen,
  loadingRestaurants,
}) => {
  const subtotalAfterCoupon = Math.max(0, subtotal - couponDiscount);
  const subtotalAfterLoyalty = Math.max(0, subtotalAfterCoupon - loyaltyDiscount);
  const total = subtotalAfterLoyalty + deliveryFee;

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
      </div>

      <div className='space-y-3 border-b pb-3'>
        <div className='space-y-2'>
          <Label htmlFor='couponCode' className='text-sm font-semibold'>
            Coupon code
          </Label>
          <div className='flex gap-2'>
            <Input
              id='couponCode'
              value={couponCode}
              onChange={(e) => onCouponCodeChange(e.target.value)}
              placeholder='SAVE10'
              autoCapitalize='characters'
              className='uppercase'
            />
            <Button
              type='button'
              variant='outline'
              onClick={onApplyCoupon}
              disabled={isApplyingCoupon || !couponCode.trim()}
              className='whitespace-nowrap'
            >
              {isApplyingCoupon ? 'Checking...' : 'Apply'}
            </Button>
          </div>
          <p className='text-xs text-muted-foreground'>
            Use uppercase letters and numbers only. Supported discounts run from 5% to 90%.
          </p>
          {couponMessage && !couponError && (
            <p className='text-sm text-green-600 font-medium'>{couponMessage}</p>
          )}
          {couponError && <p className='text-sm text-red-600 font-medium'>{couponError}</p>}
        </div>

        {couponDiscount > 0 && (
          <div className='flex justify-between text-green-600 text-sm sm:text-base'>
            <span className='font-semibold'>Coupon Discount:</span>
            <span>- ${couponDiscount.toFixed(2)}</span>
          </div>
        )}

        {loyaltyDiscountPercentage > 0 && (
          <div className='flex justify-between text-green-600 text-sm sm:text-base'>
            <span className='font-semibold'>Loyalty Discount ({loyaltyDiscountPercentage}%):</span>
            <span>- ${loyaltyDiscount.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className='border-t pt-3'>
        <div className='flex justify-between text-lg sm:text-xl font-bold text-foreground'>
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
        {(loyaltyDiscountPercentage > 0 || couponDiscount > 0) && (
          <div className='mt-2 text-xs text-center text-green-600'>
            {couponDiscount > 0 && loyaltyDiscountPercentage > 0
              ? `🎉 You saved $${couponDiscount.toFixed(2)} on your food and $${loyaltyDiscount.toFixed(2)} with loyalty rewards!`
              : couponDiscount > 0
                ? `🎉 You saved $${couponDiscount.toFixed(2)} on your order with this coupon!`
                : `🎉 You saved $${loyaltyDiscount.toFixed(2)} with loyalty rewards on your food!`}
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
