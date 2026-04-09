import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'Loyalty Program',
  description: 'Track your points, unlock rewards, and get more from every order.',
  path: '/loyalty',
});

const LoyaltyLayout = ({ children }: { children: React.ReactNode }) => children;

export default LoyaltyLayout;
