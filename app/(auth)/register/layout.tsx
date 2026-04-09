import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'Register',
  description: 'Create your account to order food faster and personalize your experience.',
  path: '/register',
  noIndex: true,
});

const RegisterLayout = ({ children }: { children: React.ReactNode }) => children;

export default RegisterLayout;
