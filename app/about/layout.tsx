import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'About Us',
  description: 'Learn about our mission to connect people with great local food experiences.',
  path: '/about',
});

const AboutLayout = ({ children }: { children: React.ReactNode }) => children;

export default AboutLayout;
