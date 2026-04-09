import type { Metadata } from 'next';
import { createPageMetadata } from '@/libs/metadata';

type LayoutProps = {
  children: React.ReactNode;
  params: { restaurantId: string } | Promise<{ restaurantId: string }>;
};

export const generateMetadata = async ({ params }: LayoutProps): Promise<Metadata> => {
  const { restaurantId } = await Promise.resolve(params);

  return createPageMetadata({
    title: `Admin Edit Restaurant ${restaurantId}`,
    description: 'Edit restaurant profile, contact, and availability details.',
    path: `/admin-dashboard/restaurant/edit/${restaurantId}`,
    noIndex: true,
  });
};

const AdminEditRestaurantLayout = ({ children }: { children: React.ReactNode }) => children;

export default AdminEditRestaurantLayout;
