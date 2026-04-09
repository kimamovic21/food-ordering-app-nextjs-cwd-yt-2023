import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'Home',
  description: 'Discover popular meals, featured restaurants, and quick ordering options.',
  path: '/',
});

const HomeLayout = ({ children }: { children: React.ReactNode }) => children;

export default HomeLayout;
