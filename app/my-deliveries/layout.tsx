import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'My Deliveries',
  description: 'Review assigned deliveries and monitor progress for each order.',
  path: '/my-deliveries',
});

const MyDeliveriesLayout = ({ children }: { children: React.ReactNode }) => children;

export default MyDeliveriesLayout;
