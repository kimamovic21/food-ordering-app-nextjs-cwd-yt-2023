import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'Your Cart',
  description: 'Review selected items, update quantities, and continue to checkout.',
  path: '/cart',
});

const CartLayout = ({ children }: { children: React.ReactNode }) => children;

export default CartLayout;
