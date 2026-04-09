import type { Metadata } from 'next';
import { createPageMetadata } from '@/libs/metadata';

type LayoutProps = {
  children: React.ReactNode;
  params: { id: string } | Promise<{ id: string }>;
};

export const generateMetadata = async ({ params }: LayoutProps): Promise<Metadata> => {
  const { id } = await Promise.resolve(params);

  return createPageMetadata({
    title: `Restaurant ${id} Menu`,
    description: 'Explore this restaurant menu and choose meals for your order.',
    path: `/restaurants/${id}/menu`,
  });
};

const RestaurantMenuLayout = ({ children }: { children: React.ReactNode }) => children;

export default RestaurantMenuLayout;
