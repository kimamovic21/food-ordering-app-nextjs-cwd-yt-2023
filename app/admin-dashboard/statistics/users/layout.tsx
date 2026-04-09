import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'Admin User Statistics',
  description: 'Track user growth, retention, and activity metrics.',
  path: '/admin-dashboard/statistics/users',
  noIndex: true,
});

const AdminUserStatisticsLayout = ({ children }: { children: React.ReactNode }) => children;

export default AdminUserStatisticsLayout;
