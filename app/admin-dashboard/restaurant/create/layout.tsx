import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'Admin Create Restaurant',
  description: 'Add a new restaurant and set up its key operational information.',
  path: '/admin-dashboard/restaurant/create',
  noIndex: true,
});

const AdminCreateRestaurantLayout = ({ children }: { children: React.ReactNode }) => children;

export default AdminCreateRestaurantLayout;
