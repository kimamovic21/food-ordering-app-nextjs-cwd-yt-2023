import type { Metadata } from 'next';
import { createPageMetadata } from '@/libs/metadata';

type LayoutProps = {
  children: React.ReactNode;
  params: { id: string } | Promise<{ id: string }>;
};

export const generateMetadata = async ({ params }: LayoutProps): Promise<Metadata> => {
  const { id } = await Promise.resolve(params);

  return createPageMetadata({
    title: `Admin User ${id}`,
    description: 'View and update user profile data and role permissions.',
    path: `/admin-dashboard/users/${id}`,
    noIndex: true,
  });
};

const AdminUserDetailsLayout = ({ children }: { children: React.ReactNode }) => children;

export default AdminUserDetailsLayout;
