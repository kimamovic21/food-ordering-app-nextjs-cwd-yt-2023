import { createPageMetadata } from '@/libs/metadata';
import CourierDashboardClientLayout from './CourierDashboardClientLayout';

export const metadata = createPageMetadata({
  title: 'Courier Dashboard',
  description: 'Manage active deliveries, delivery history, and courier ratings in one place.',
  path: '/courier-dashboard',
});

const CourierDashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return <CourierDashboardClientLayout>{children}</CourierDashboardClientLayout>;
};

export default CourierDashboardLayout;
