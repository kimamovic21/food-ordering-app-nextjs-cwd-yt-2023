import type { Metadata } from 'next';
import { createPageMetadata } from '@/libs/metadata';

type LayoutProps = {
  children: React.ReactNode;
  params: { id: string } | Promise<{ id: string }>;
};

export const generateMetadata = async ({ params }: LayoutProps): Promise<Metadata> => {
  const { id } = await Promise.resolve(params);

  return createPageMetadata({
    title: `Admin Order ${id}`,
    description: 'Inspect order details, payment state, and delivery information.',
    path: `/admin-dashboard/orders/${id}`,
    noIndex: true,
  });
};

const AdminOrderDetailsLayout = ({ children }: { children: React.ReactNode }) => children;

export default AdminOrderDetailsLayout;
