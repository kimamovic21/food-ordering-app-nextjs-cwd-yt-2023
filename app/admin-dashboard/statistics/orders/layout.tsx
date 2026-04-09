import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'Admin Order Statistics',
  description: 'Review order trends, volume, and revenue performance data.',
  path: '/admin-dashboard/statistics/orders',
  noIndex: true,
});

const AdminOrderStatisticsLayout = ({ children }: { children: React.ReactNode }) => children;

export default AdminOrderStatisticsLayout;
