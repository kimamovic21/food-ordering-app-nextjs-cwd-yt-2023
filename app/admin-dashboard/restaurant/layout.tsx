import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'Admin Restaurant',
  description: 'Manage restaurant profile information, operations, and settings.',
  path: '/admin-dashboard/restaurant',
  noIndex: true,
});

const AdminRestaurantLayout = ({ children }: { children: React.ReactNode }) => children;

export default AdminRestaurantLayout;
