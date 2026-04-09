import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'Admin Couriers',
  description: 'Manage courier accounts, availability, and delivery assignments.',
  path: '/admin-dashboard/couriers',
  noIndex: true,
});

const AdminCouriersLayout = ({ children }: { children: React.ReactNode }) => children;

export default AdminCouriersLayout;
