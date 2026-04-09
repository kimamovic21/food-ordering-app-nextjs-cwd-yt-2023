import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'My Reviews',
  description: 'View and manage your ratings and feedback for meals and restaurants.',
  path: '/reviews',
});

const ReviewsLayout = ({ children }: { children: React.ReactNode }) => children;

export default ReviewsLayout;
