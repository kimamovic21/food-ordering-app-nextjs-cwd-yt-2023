import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import OrderItemsDataTable from '@/components/shared/OrderItemsDataTable';

type CartProduct = {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
};

type OrderItemsCardProps = {
  cartProducts: CartProduct[];
  total: number;
  taxPercentage?: number;
  taxAmount?: number;
  deliveryFee?: number;
  loyaltyDiscount?: number;
  loyaltyDiscountPercentage?: number;
  loyaltyTier?: string;
};

const OrderItemsCard = ({
  cartProducts,
  total,
  taxPercentage,
  taxAmount,
  deliveryFee,
  loyaltyDiscount,
  loyaltyDiscountPercentage,
  loyaltyTier,
}: OrderItemsCardProps) => {
  const subtotal = cartProducts.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxPercent = taxPercentage || 10;
  const includedTax = taxAmount ?? subtotal * (taxPercent / 100);
  const discount = loyaltyDiscount || 0;
  const calculatedDeliveryFee = deliveryFee || 5;
  const discountedSubtotal = Math.max(0, subtotal - discount);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Items</CardTitle>
      </CardHeader>
      <CardContent>
        <OrderItemsDataTable cartProducts={cartProducts} tableKey='admin-order-items' />

        <div className='mt-6 space-y-2 border-t pt-4'>
          <div className='flex justify-between text-muted-foreground'>
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className='flex justify-between text-muted-foreground'>
            <span>Included Tax ({taxPercent}%):</span>
            <span>${includedTax.toFixed(2)}</span>
          </div>

          <div className='border-t pt-2 space-y-1'>
            <div className='flex justify-between text-muted-foreground'>
              <span>Delivery Fee:</span>
              <span>${calculatedDeliveryFee.toFixed(2)}</span>
            </div>

            {discount > 0 && (
              <div className='flex justify-between text-green-600 text-sm pl-2'>
                <span>
                  - Loyalty Discount ({loyaltyDiscountPercentage}%)
                  {loyaltyTier && <span className='text-xs ml-1'>• {loyaltyTier}</span>}:
                </span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            {discount > 0 && (
              <div className='flex justify-between text-muted-foreground font-semibold border-t border-dashed pt-1'>
                <span>Food Subtotal After Loyalty:</span>
                <span>${discountedSubtotal.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className='flex justify-between text-lg font-semibold pt-2 border-t'>
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderItemsCard;
