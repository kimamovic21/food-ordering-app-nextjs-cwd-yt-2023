import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'Admin Orders',
  description: 'Monitor order activity, statuses, and fulfillment workflows.',
  path: '/admin-dashboard/orders',
  noIndex: true,
});

const AdminOrdersLayout = ({ children }: { children: React.ReactNode }) => children;

export default AdminOrdersLayout;
