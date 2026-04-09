import type { Metadata } from 'next';
import { createPageMetadata } from '@/libs/metadata';

type LayoutProps = {
  children: React.ReactNode;
  params: { id: string } | Promise<{ id: string }>;
};

export const generateMetadata = async ({ params }: LayoutProps): Promise<Metadata> => {
  const { id } = await Promise.resolve(params);

  return createPageMetadata({
    title: `Delivery #${id}`,
    description: 'Track delivery status, route information, and order details in real time.',
    path: `/my-deliveries/${id}`,
  });
};

const MyDeliveryDetailsLayout = ({ children }: { children: React.ReactNode }) => children;

export default MyDeliveryDetailsLayout;
