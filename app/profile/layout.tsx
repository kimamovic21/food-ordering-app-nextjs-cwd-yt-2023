import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'Your Profile',
  description: 'Manage personal information, addresses, and account preferences.',
  path: '/profile',
});

const ProfileLayout = ({ children }: { children: React.ReactNode }) => children;

export default ProfileLayout;
