import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'My Orders',
  description: 'Track your order history, statuses, and recent purchases.',
  path: '/my-orders',
});

const MyOrdersLayout = ({ children }: { children: React.ReactNode }) => children;

export default MyOrdersLayout;
