import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'Favorite Meals',
  description: 'Quickly access and reorder the meals you love the most.',
  path: '/favorite-meals',
});

const FavoriteMealsLayout = ({ children }: { children: React.ReactNode }) => children;

export default FavoriteMealsLayout;
