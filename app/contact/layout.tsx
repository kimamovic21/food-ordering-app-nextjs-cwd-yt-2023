import { createPageMetadata } from '@/libs/metadata';

export const metadata = createPageMetadata({
  title: 'Contact',
  description: 'Reach out to support, ask questions, or get help with your orders.',
  path: '/contact',
});

const ContactLayout = ({ children }: { children: React.ReactNode }) => children;

export default ContactLayout;
