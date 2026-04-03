'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin-dashboard');

  return (
    <>
      {!isAdminRoute && <Header />}
      <main className={`flex-1 ${isAdminRoute ? 'w-full' : 'max-w-7xl mx-auto p-4 mt-16'}`}>
        {children}
      </main>
      {!isAdminRoute && <Footer />}
    </>
  );
}
