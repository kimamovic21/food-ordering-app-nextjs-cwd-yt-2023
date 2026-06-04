'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin-dashboard');
  const isCourierDashboardRoute = pathname?.startsWith('/courier-dashboard');
  const isMessagesRoute = pathname?.startsWith('/messages');
  const isDashboardRoute = isAdminRoute || isCourierDashboardRoute;
  const contentClassName = isDashboardRoute
    ? 'fixed inset-0 h-dvh w-dvw overflow-hidden'
    : isMessagesRoute
      ? 'max-w-[1840px] mx-auto p-4 mt-16'
      : 'max-w-7xl mx-auto p-4 mt-16';

  useEffect(() => {
    const previousHtmlOverflowY = document.documentElement.style.overflowY;
    const previousBodyOverflow = document.body.style.overflow;

    if (isDashboardRoute) {
      document.documentElement.style.overflowY = 'hidden';
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.documentElement.style.overflowY = previousHtmlOverflowY;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isDashboardRoute]);

  return (
    <>
      {!isDashboardRoute && <Header />}
      <main className={`flex-1 ${contentClassName}`}>{children}</main>
      {!isDashboardRoute && <Footer />}
    </>
  );
}
