import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'Admin Categories',
  description: 'Manage menu categories used across restaurants and dishes.',
  path: '/admin-dashboard/categories',
  noIndex: true,
});

const AdminCategoriesLayout = ({ children }: { children: React.ReactNode }) => children;

export default AdminCategoriesLayout;
