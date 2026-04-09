import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'Admin Users',
  description: 'Review user accounts, roles, and administrative controls.',
  path: '/admin-dashboard/users',
  noIndex: true,
});

const AdminUsersLayout = ({ children }: { children: React.ReactNode }) => children;

export default AdminUsersLayout;
