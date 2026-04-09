import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'Checkout',
  description: 'Confirm delivery details, payment, and place your order securely.',
  path: '/checkout',
});

const CheckoutLayout = ({ children }: { children: React.ReactNode }) => children;

export default CheckoutLayout;
