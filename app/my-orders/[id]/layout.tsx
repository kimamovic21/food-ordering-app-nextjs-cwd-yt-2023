import type { Metadata } from 'next';
import { createPageMetadata } from '@/libs/metadata';

type LayoutProps = {
  children: React.ReactNode;
  params: { id: string } | Promise<{ id: string }>;
};

export const generateMetadata = async ({ params }: LayoutProps): Promise<Metadata> => {
  const { id } = await Promise.resolve(params);

  return createPageMetadata({
    title: `Order #${id}`,
    description: 'View detailed order status, items, totals, and delivery updates.',
    path: `/my-orders/${id}`,
  });
};

const MyOrderDetailsLayout = ({ children }: { children: React.ReactNode }) => children;

export default MyOrderDetailsLayout;
