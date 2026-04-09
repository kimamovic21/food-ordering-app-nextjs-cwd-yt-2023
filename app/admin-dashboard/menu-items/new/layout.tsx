import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'Admin New Menu Item',
  description: 'Create new menu items and configure their display details.',
  path: '/admin-dashboard/menu-items/new',
  noIndex: true,
});

const AdminNewMenuItemLayout = ({ children }: { children: React.ReactNode }) => children;

export default AdminNewMenuItemLayout;
