'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import {
  BarChart3,
  Bell,
  Home,
  List,
  LogOut,
  Menu,
  PieChart,
  TicketPercent,
  ShoppingCart,
  SquareMenu,
  Truck,
  Users,
  Utensils,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import useProfile from '@/contexts/UseProfile';
import NotificationBell from '@/components/shared/NotificationBell';
import Link from 'next/link';

const AdminDashboardLayoutSkeleton = () => {
  return (
    <section className='w-full min-h-screen md:h-screen flex flex-col md:flex-row md:overflow-hidden'>
      <aside className='hidden md:flex md:flex-col w-72 md:h-full bg-card border-r border-border overflow-y-auto'>
        <div className='p-6 border-b border-border space-y-3'>
          <Skeleton className='h-3 w-24' />
          <Skeleton className='h-7 w-40' />
        </div>

        <div className='px-4 pt-4 pb-3 border-b border-border'>
          <Skeleton className='h-12 w-full rounded-lg' />
        </div>

        <div className='flex-1 p-4 space-y-2'>
          {Array.from({ length: 8 }).map((_, index) => (
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

      <div className='md:hidden p-4 border-b border-border bg-card'>
        <Skeleton className='h-10 w-full rounded-lg' />
      </div>

      <div className='flex-1 md:h-full md:overflow-y-auto'>
        <div className='p-4 md:p-6 space-y-8'>
          <Skeleton className='h-56 w-full rounded-2xl' />
          <div className='space-y-4'>
            <Skeleton className='h-8 w-44' />
            <div className='grid gap-4 md:grid-cols-3'>
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className='h-56 w-full rounded-xl' />
              ))}
            </div>
          </div>
          <Skeleton className='h-28 w-full rounded-xl' />
        </div>
      </div>
    </section>
  );
};

const AdminDashboardClientLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: profileData, loading } = useProfile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);

  const isAdmin = profileData?.role === 'admin';
  const isSuperAdmin = isAdmin && profileData?.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, loading, router]);

  useEffect(() => {
    if (loading || !isAdmin) {
      return;
    }

    let isMounted = true;

    const fetchActiveOrdersCount = async () => {
      try {
        const response = await fetch('/api/orders/active-count', { cache: 'no-store' });

        if (!response.ok) {
          if (response.status === 403 && isMounted) {
            setActiveOrdersCount(0);
          }
          return;
        }

        const json = await response.json();
        if (isMounted) {
          setActiveOrdersCount(Number(json.activeOrdersCount) || 0);
        }
      } catch {
        // Keep the previous count if the network briefly fails.
      }
    };

    fetchActiveOrdersCount();
    const interval = setInterval(fetchActiveOrdersCount, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [loading, isAdmin]);

  const links = [
    {
      href: '/admin-dashboard',
      label: 'Overview',
      superAdminOnly: false,
      icon: PieChart,
    },
    {
      href: '/admin-dashboard/restaurant',
      label: 'Restaurant',
      superAdminOnly: false,
      icon: Utensils,
    },
    {
      href: '/admin-dashboard/menu-items',
      label: 'Menu Items',
      superAdminOnly: false,
      icon: SquareMenu,
    },
    {
      href: '/admin-dashboard/coupons',
      label: 'Coupons',
      superAdminOnly: false,
      icon: TicketPercent,
    },
    { href: '/admin-dashboard/orders', label: 'Orders', superAdminOnly: false, icon: ShoppingCart },
    { href: '/admin-dashboard/categories', label: 'Categories', superAdminOnly: true, icon: List },
    { href: '/admin-dashboard/users', label: 'Users', superAdminOnly: true, icon: Users },
    { href: '/admin-dashboard/couriers', label: 'Couriers', superAdminOnly: true, icon: Truck },
    {
      href: '/admin-dashboard/statistics',
      label: 'Statistics',
      superAdminOnly: true,
      icon: BarChart3,
    },
  ];

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  if (loading) {
    return <AdminDashboardLayoutSkeleton />;
  }

  if (!isAdmin) {
    return <div className='p-6 text-sm text-muted-foreground'>Redirecting...</div>;
  }

  return (
    <section className='w-full min-h-screen md:h-screen flex flex-col md:flex-row md:overflow-hidden'>
      {/* Mobile Toggle Button */}
      <div className='md:hidden flex items-center justify-between p-4 border-b border-border bg-card'>
        <h2 className='text-lg font-semibold'>Admin Panel</h2>
        <div className='flex items-center gap-2'>
          <NotificationBell iconSize={20} />
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className='p-2 hover:bg-muted rounded-lg'
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'block' : 'hidden'
        } md:flex md:flex-col w-full md:w-72 md:h-full bg-card border-r border-border flex-col overflow-y-auto`}
      >
        {/* Logo Section - Hidden on Mobile */}
        <div className='hidden md:block p-6 border-b border-border'>
          <p className='text-xs uppercase tracking-wide text-muted-foreground'>Admin Panel</p>
          <h2 className='text-lg font-semibold mt-2'>Control Center</h2>
        </div>

        {/* Home Button - Outside Navigation */}
        <div className='hidden md:block px-4 pt-4 pb-3 border-b border-border'>
          <Link
            href='/'
            onClick={() => setIsSidebarOpen(false)}
            className='flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-accent text-muted-foreground hover:text-foreground bg-muted/50'
          >
            <Home size={18} />
            <span>Go back to home</span>
          </Link>

          <Link
            href='/notifications'
            onClick={() => setIsSidebarOpen(false)}
            className={`mt-2 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
              pathname?.startsWith('/notifications')
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            <Bell size={20} />
            <span>Notifications</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className='flex-1 p-4 space-y-2'>
          {/* Home Button - Mobile Only */}
          <Link
            href='/'
            onClick={() => setIsSidebarOpen(false)}
            className='md:hidden flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-accent text-muted-foreground hover:text-foreground bg-muted/50'
          >
            <Home size={18} />
            <span>Go back to home</span>
          </Link>

          {/* Notifications Link - Always directly under Home */}
          <Link
            href='/notifications'
            onClick={() => setIsSidebarOpen(false)}
            className={`md:hidden flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
              pathname?.startsWith('/notifications')
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            <Bell size={20} />
            <span>Notifications</span>
          </Link>

          {/* Separator on Mobile */}
          <div className='md:hidden h-px bg-border my-2'></div>

          {/* Navigation Links */}
          {links
            .filter((link) => (link.superAdminOnly ? isSuperAdmin : true))
            .map((link) => {
              const Icon = link.icon;
              const isOrdersLink = link.href === '/admin-dashboard/orders';
              const isActive =
                link.href === '/admin-dashboard'
                  ? pathname === '/admin-dashboard'
                  : pathname?.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon size={20} />
                  <span>{link.label}</span>
                  {isOrdersLink && activeOrdersCount > 0 && (
                    <span
                      className={`ml-auto inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isActive
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      New {activeOrdersCount}
                    </span>
                  )}
                </Link>
              );
            })}
        </nav>

        {/* User Section */}
        <div className='border-t border-border p-4 space-y-4'>
          <div className='flex items-center justify-between px-2'>
            <p className='text-xs uppercase tracking-wide text-muted-foreground'>Notifications</p>
            <NotificationBell iconSize={19} />
          </div>

          {/* User Info */}
          <div className='px-2 py-3'>
            <p className='text-xs uppercase tracking-wide text-muted-foreground'>Logged in as</p>
            <p className='text-sm font-semibold mt-1 truncate text-foreground'>
              {profileData?.email || 'Admin User'}
            </p>
            {isSuperAdmin && (
              <span className='inline-block mt-2 px-2 py-1 text-xs font-medium bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 rounded'>
                Super Admin
              </span>
            )}
          </div>

          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            variant='outline'
            className='w-full flex items-center justify-center gap-2'
          >
            <LogOut size={18} />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className='flex-1 md:h-full md:overflow-y-auto'>
        <div className='p-4 md:p-6'>{children}</div>
      </div>
    </section>
  );
};

export default AdminDashboardClientLayout;
