import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'My Reports',
  description: 'Track problem reports and support ticket responses for your orders.',
  path: '/my-reports',
  noIndex: true,
});

const MyReportsLayout = ({ children }: { children: React.ReactNode }) => children;

export default MyReportsLayout;
