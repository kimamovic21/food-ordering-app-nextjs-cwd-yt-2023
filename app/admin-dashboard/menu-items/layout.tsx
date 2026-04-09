import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'Admin Menu Items',
  description: 'Manage menu offerings, pricing, and item availability.',
  path: '/admin-dashboard/menu-items',
  noIndex: true,
});

const AdminMenuItemsLayout = ({ children }: { children: React.ReactNode }) => children;

export default AdminMenuItemsLayout;
