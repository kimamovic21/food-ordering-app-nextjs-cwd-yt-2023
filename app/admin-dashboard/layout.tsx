import { createPageMetadata } from '@/libs/metadata';
import AdminDashboardClientLayout from './AdminDashboardClientLayout';

export const metadata = createPageMetadata({
  title: 'Admin Dashboard',
  description:
    'Monitor platform activity, orders, and operational metrics from the admin dashboard.',
  path: '/admin-dashboard',
  noIndex: true,
});

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return <AdminDashboardClientLayout>{children}</AdminDashboardClientLayout>;
};

export default AdminLayout;
