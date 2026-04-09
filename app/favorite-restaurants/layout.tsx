import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'Favorite Restaurants',
  description: 'See saved restaurants and jump back to their latest menu items.',
  path: '/favorite-restaurants',
});

const FavoriteRestaurantsLayout = ({ children }: { children: React.ReactNode }) => children;

export default FavoriteRestaurantsLayout;
