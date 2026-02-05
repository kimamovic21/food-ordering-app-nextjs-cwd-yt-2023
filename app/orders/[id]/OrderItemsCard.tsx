import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

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
  deliveryFee?: number;
  loyaltyDiscount?: number;
  loyaltyDiscountPercentage?: number;
  loyaltyTier?: string;
};

const OrderItemsCard = ({
  cartProducts,
  total,
  taxPercentage,
  deliveryFee,
  loyaltyDiscount,
  loyaltyDiscountPercentage,
  loyaltyTier,
}: OrderItemsCardProps) => {
  const subtotal = cartProducts.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxPercent = taxPercentage || 10;
  const calculatedTax = subtotal * (taxPercent / 100);
  const discount = loyaltyDiscount || 0;
  const calculatedDeliveryFee = deliveryFee || 5;
  const discountedDeliveryFee = calculatedDeliveryFee - discount;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='text-left'>Product Name</TableHead>
                <TableHead className='text-left'>Size</TableHead>
                <TableHead className='text-center'>Quantity</TableHead>
                <TableHead className='text-right'>Price</TableHead>
                <TableHead className='text-right'>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cartProducts.map((product, index) => (
                <TableRow key={index}>
                  <TableCell className='font-medium'>{product.name}</TableCell>
                  <TableCell className='capitalize'>{product.size}</TableCell>
                  <TableCell className='text-center'>{product.quantity}</TableCell>
                  <TableCell className='text-right'>${product.price.toFixed(2)}</TableCell>
                  <TableCell className='text-right font-semibold'>
                    ${(product.price * product.quantity).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className='mt-6 space-y-2 border-t pt-4'>
          <div className='flex justify-between text-muted-foreground'>
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className='flex justify-between text-muted-foreground'>
            <span>Tax ({taxPercent}%):</span>
            <span>${calculatedTax.toFixed(2)}</span>
          </div>

          {/* Delivery Fee */}
          <div className='border-t pt-2 space-y-1'>
            <div className='flex justify-between text-muted-foreground'>
              <span>Delivery Fee:</span>
              <span>${calculatedDeliveryFee.toFixed(2)}</span>
            </div>

            {/* Loyalty Discount on Delivery */}
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
                <span>Final Delivery Fee:</span>
                <span>${discountedDeliveryFee.toFixed(2)}</span>
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
