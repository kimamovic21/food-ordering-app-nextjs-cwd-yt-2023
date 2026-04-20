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
  const isCourierDashboardRoute = pathname?.startsWith('/courier-dashboard');
  const isDashboardRoute = isAdminRoute || isCourierDashboardRoute;

  return (
    <>
      {!isDashboardRoute && <Header />}
      <main className={`flex-1 ${isDashboardRoute ? 'w-full' : 'max-w-7xl mx-auto p-4 mt-16'}`}>
        {children}
      </main>
      {!isDashboardRoute && <Footer />}
    </>
  );
}
