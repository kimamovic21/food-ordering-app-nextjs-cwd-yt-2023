'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { Bike, ClipboardCheck, Home, LogOut, Menu, Star, Truck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import useProfile from '@/contexts/UseProfile';
import { cn } from '@/libs/utils';

const CourierDashboardLayoutSkeleton = () => {
  return (
    <section className='w-full min-h-screen xl:h-screen flex flex-col xl:flex-row xl:overflow-hidden bg-linear-to-b from-background to-muted/30'>
      <aside className='hidden xl:flex xl:flex-col w-80 xl:h-full bg-card/80 border-r border-border/70 backdrop-blur overflow-y-auto'>
        <div className='p-6 border-b border-border space-y-3'>
          <Skeleton className='h-3 w-24' />
          <Skeleton className='h-7 w-40' />
        </div>

        <div className='px-4 pt-4 pb-3 border-b border-border'>
          <Skeleton className='h-12 w-full rounded-lg' />
        </div>

        <div className='flex-1 p-4 space-y-2'>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className='h-12 w-full rounded-lg' />
          ))}
        </div>

        <div className='border-t border-border p-4 space-y-4'>
          <div className='space-y-2'>
            <Skeleton className='h-3 w-24' />
            <Skeleton className='h-5 w-48' />
            <Skeleton className='h-6 w-24 rounded-full' />
          </div>
          <Skeleton className='h-10 w-full rounded-lg' />
        </div>
      </aside>

      <div className='xl:hidden p-4 border-b border-border bg-card/80 backdrop-blur'>
        <Skeleton className='h-10 w-full rounded-lg' />
      </div>

      <div className='flex-1 md:h-full md:overflow-y-auto'>
        <div className='p-4 xl:p-8 space-y-6'>
          <Skeleton className='h-48 w-full rounded-2xl' />
          <Skeleton className='h-64 w-full rounded-xl' />
        </div>
      </div>
    </section>
  );
};

const CourierDashboardClientLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: profileData, loading } = useProfile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isCourier = profileData?.role === 'courier';

  useEffect(() => {
    if (!loading && !isCourier) {
      router.push('/');
    }
  }, [isCourier, loading, router]);

  const links = [
    {
      href: '/courier-dashboard/my-delivery',
      label: 'Active Delivery',
      icon: Bike,
    },
    {
      href: '/courier-dashboard/my-deliveries',
      label: 'Delivery History',
      icon: ClipboardCheck,
    },
    {
      href: '/courier-dashboard/reviews',
      label: 'My Ratings',
      icon: Star,
    },
  ];

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  if (loading) {
    return <CourierDashboardLayoutSkeleton />;
  }

  if (!isCourier) {
    return <div className='p-6 text-sm text-muted-foreground'>Redirecting...</div>;
  }

  return (
    <section className='w-full min-h-screen xl:h-screen flex flex-col xl:flex-row xl:overflow-hidden bg-linear-to-b from-background via-background to-muted/30'>
      <div className='xl:hidden flex items-center justify-between p-4 border-b border-border/70 bg-card/85 backdrop-blur supports-backdrop-filter:bg-card/65'>
        <div>
          <p className='text-[11px] uppercase tracking-[0.2em] text-muted-foreground'>
            Courier Panel
          </p>
          <h2 className='text-lg font-semibold leading-tight'>Delivery Center</h2>
        </div>
        <Button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          variant='outline'
          size='icon'
          className='rounded-xl'
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      <aside
        className={cn(
          isSidebarOpen ? 'block' : 'hidden',
          'xl:flex xl:flex-col w-full xl:w-80 xl:h-full bg-card/88 backdrop-blur border-r border-border/70 flex-col overflow-y-auto'
        )}
      >
        <div className='hidden xl:block p-6 border-b border-border/70'>
          <p className='text-[11px] uppercase tracking-[0.2em] text-muted-foreground'>
            Courier Dashboard
          </p>
          <h2 className='text-xl font-semibold mt-2'>Delivery Center</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Manage active routes, history, and ratings.
          </p>
        </div>

        <div className='hidden xl:block px-4 pt-4 pb-3 border-b border-border/70'>
          <Link
            href='/'
            onClick={() => setIsSidebarOpen(false)}
            className='flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors hover:bg-accent text-muted-foreground hover:text-foreground bg-muted/50'
          >
            <Home size={18} />
            <span>Go back to home</span>
          </Link>
        </div>

        <nav className='flex-1 p-4 space-y-2'>
          <Link
            href='/'
            onClick={() => setIsSidebarOpen(false)}
            className='xl:hidden flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors hover:bg-accent text-muted-foreground hover:text-foreground bg-muted/50'
          >
            <Home size={18} />
            <span>Go back to home</span>
          </Link>

          <div className='xl:hidden h-px bg-border my-2'></div>

          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname?.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                    : 'text-foreground hover:bg-muted/80 hover:translate-x-0.5'
                }`}
              >
                <span
                  className={cn(
                    'inline-flex size-8 items-center justify-center rounded-lg border transition-colors',
                    isActive
                      ? 'border-primary-foreground/30 bg-primary-foreground/15'
                      : 'border-border bg-background group-hover:bg-card'
                  )}
                >
                  <Icon size={16} />
                </span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className='border-t border-border/70 p-4 space-y-4'>
          <div className='px-2 py-3 rounded-xl bg-muted/40 border border-border/60'>
            <p className='text-xs uppercase tracking-wide text-muted-foreground'>Logged in as</p>
            <p className='text-sm font-semibold mt-1 truncate text-foreground'>
              {profileData?.email || 'Courier User'}
            </p>
            <span className='inline-flex items-center gap-1 mt-2 px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded'>
              <Truck className='size-3.5' />
              Courier
            </span>
          </div>

          <Button
            onClick={handleLogout}
            variant='outline'
            className='w-full flex items-center justify-center gap-2'
          >
            <LogOut size={16} />
            Logout
          </Button>
        </div>
      </aside>

      <div className='flex-1 md:h-full md:overflow-y-auto'>
        <div className='p-4 md:p-8'>
          <div className='mx-auto w-full max-w-[1380px] rounded-2xl border border-border/60 bg-background/85 shadow-sm p-3 md:p-5'>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourierDashboardClientLayout;
