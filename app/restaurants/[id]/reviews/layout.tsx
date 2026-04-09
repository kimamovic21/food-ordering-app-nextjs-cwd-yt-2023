import type { Metadata } from 'next';
import { createPageMetadata } from '@/libs/metadata';

type LayoutProps = {
  children: React.ReactNode;
  params: { id: string } | Promise<{ id: string }>;
};

export const generateMetadata = async ({ params }: LayoutProps): Promise<Metadata> => {
  const { id } = await Promise.resolve(params);

  return createPageMetadata({
    title: `Restaurant ${id} Reviews`,
    description: 'Read ratings and customer feedback before placing an order.',
    path: `/restaurants/${id}/reviews`,
  });
};

const RestaurantReviewsLayout = ({ children }: { children: React.ReactNode }) => children;

export default RestaurantReviewsLayout;
