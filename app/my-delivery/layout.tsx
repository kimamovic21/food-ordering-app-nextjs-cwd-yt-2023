import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'My Delivery',
  description: 'Manage active delivery tasks, availability, and live route information.',
  path: '/my-delivery',
});

const MyDeliveryLayout = ({ children }: { children: React.ReactNode }) => children;

export default MyDeliveryLayout;
