import { Card } from '@/components/ui/card';

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
    <Card className='p-6 bg-card text-card-foreground border border-border shadow-sm h-full flex flex-col'>
      <h2 className='text-lg font-semibold mb-4'>Order Items</h2>
      <div className='overflow-hidden'>
        <table className='w-full'>
          <thead className='bg-muted border-b border-border'>
            <tr>
              <th className='px-4 py-2 text-left text-sm font-semibold text-muted-foreground'>
                Product Name
              </th>
              <th className='px-4 py-2 text-left text-sm font-semibold text-muted-foreground'>
                Size
              </th>
              <th className='px-4 py-2 text-center text-sm font-semibold text-muted-foreground'>
                Quantity
              </th>
              <th className='px-4 py-2 text-right text-sm font-semibold text-muted-foreground'>
                Price
              </th>
              <th className='px-4 py-2 text-right text-sm font-semibold text-muted-foreground'>
                Total
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-border'>
            {cartProducts.map((product, index) => (
              <tr key={index} className='hover:bg-muted/50'>
                <td className='px-4 py-3 font-medium'>{product.name}</td>
                <td className='px-4 py-3 text-muted-foreground capitalize'>{product.size}</td>
                <td className='px-4 py-3 text-center text-muted-foreground'>{product.quantity}</td>
                <td className='px-4 py-3 text-right text-muted-foreground'>
                  ${product.price.toFixed(2)}
                </td>
                <td className='px-4 py-3 text-right font-semibold'>
                  ${(product.price * product.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='mt-auto pt-6 space-y-2 border-t border-border'>
        <div className='flex justify-between text-muted-foreground'>
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className='flex justify-between text-muted-foreground'>
          <span>Included Tax ({taxPercent}%):</span>
          <span>${includedTax.toFixed(2)}</span>
        </div>

        <div className='border-t border-border pt-2 space-y-1'>
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
            <div className='flex justify-between text-muted-foreground font-semibold border-t border-dashed border-border pt-1'>
              <span>Food Subtotal After Loyalty:</span>
              <span>${discountedSubtotal.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className='flex justify-between text-lg font-semibold pt-2 border-t border-border'>
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </Card>
  );
};

export default OrderItemsCard;
