import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'Restaurant Operations',
  description: 'Monitor restaurant order flow, kitchen capacity, courier coverage, and alerts.',
  path: '/admin-dashboard/operations',
  noIndex: true,
});

const AdminOperationsLayout = ({ children }: { children: React.ReactNode }) => children;

export default AdminOperationsLayout;
