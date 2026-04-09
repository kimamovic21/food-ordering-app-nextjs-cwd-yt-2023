import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'Login',
  description: 'Sign in to place orders, track deliveries, and manage your account.',
  path: '/login',
  noIndex: true,
});

const LoginLayout = ({ children }: { children: React.ReactNode }) => children;

export default LoginLayout;
