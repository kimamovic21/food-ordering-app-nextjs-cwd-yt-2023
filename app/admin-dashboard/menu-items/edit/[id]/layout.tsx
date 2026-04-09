import type { Metadata } from 'next';
import { createPageMetadata } from '@/libs/metadata';

type LayoutProps = {
  children: React.ReactNode;
  params: { id: string } | Promise<{ id: string }>;
};

export const generateMetadata = async ({ params }: LayoutProps): Promise<Metadata> => {
  const { id } = await Promise.resolve(params);

  return createPageMetadata({
    title: `Admin Edit Menu Item ${id}`,
    description: 'Update menu item content, pricing, and availability settings.',
    path: `/admin-dashboard/menu-items/edit/${id}`,
    noIndex: true,
  });
};

const AdminEditMenuItemLayout = ({ children }: { children: React.ReactNode }) => children;

export default AdminEditMenuItemLayout;
