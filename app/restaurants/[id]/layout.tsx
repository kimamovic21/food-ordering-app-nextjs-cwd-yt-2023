import type { Metadata } from 'next';
import { createPageMetadata } from '@/libs/metadata';

type LayoutProps = {
  children: React.ReactNode;
  params: { id: string } | Promise<{ id: string }>;
};

export const generateMetadata = async ({ params }: LayoutProps): Promise<Metadata> => {
  const { id } = await Promise.resolve(params);

  return createPageMetadata({
    title: `Restaurant ${id}`,
    description: 'View restaurant details, opening hours, ratings, and ordering options.',
    path: `/restaurants/${id}`,
  });
};

const RestaurantDetailsLayout = ({ children }: { children: React.ReactNode }) => children;

export default RestaurantDetailsLayout;
