import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'Admin Statistics',
  description: 'Analyze platform metrics, growth indicators, and operational performance.',
  path: '/admin-dashboard/statistics',
  noIndex: true,
});

const AdminStatisticsLayout = ({ children }: { children: React.ReactNode }) => children;

export default AdminStatisticsLayout;
