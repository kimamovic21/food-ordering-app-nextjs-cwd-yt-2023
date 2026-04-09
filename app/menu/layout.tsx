import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'Browse Menu',
  description: 'Explore meals by category and find your next favorite dish.',
  path: '/menu',
});

const MenuLayout = ({ children }: { children: React.ReactNode }) => children;

export default MenuLayout;
