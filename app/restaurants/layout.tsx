import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'Restaurants',
  description: 'Browse restaurants, compare ratings, and find the best place for your next meal.',
  path: '/restaurants',
});

const RestaurantsLayout = ({ children }: { children: React.ReactNode }) => children;

export default RestaurantsLayout;
