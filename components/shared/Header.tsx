'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { IoCartOutline } from 'react-icons/io5';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import {
  MenuLinkSkeleton,
  AboutLinkSkeleton,
  ContactLinkSkeleton,
  MyOrdersLinkSkeleton,
  MyDeliveryLinkSkeleton,
  ModeToggleSkeleton,
  CartIconSkeleton,
  UserNameSkeleton,
  LogoutButtonSkeleton,
} from './HeaderSkeletons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import useProfile from '@/contexts/UseProfile';
import ModeToggle from '../theme/ModeToggle';

const Header = () => {
  const session = useSession();
  const { getTotalItems } = useCart();
  const { data: profileData } = useProfile();
  const pathname = usePathname();
  const router = useRouter();

  const status = session.status;
  const userData = session?.data?.user;
  let userName = userData?.name || userData?.email;

  if (userName && userName?.includes(' ')) {
    userName = userName.split(' ')[0];
  }

  const [mobileOpen, setMobileOpen] = useState(false);
  const totalItems = getTotalItems();
  const [bounce, setBounce] = useState(false);
  const prevCountRef = useRef(totalItems);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (totalItems !== prevCountRef.current) {
      prevCountRef.current = totalItems;

      // Defer state update to avoid synchronous setState in effect
      const updateBounce = setTimeout(() => {
        setBounce(true);

        // Clear any existing timeout before setting a new one
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          setBounce(false);
        }, 600);
      }, 0);

      return () => {
        clearTimeout(updateBounce);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [totalItems]);

  useEffect(() => {
    // Check if we just completed a login (Google OAuth or credentials)
    // This flag is set by next-auth after successful signin
    if (status === 'authenticated') {
      const hasShownToast = sessionStorage.getItem('loginToastShown');
      if (!hasShownToast) {
        toast.success('Successfully logged in', {
          style: { backgroundColor: '#22c55e', color: 'white' },
        });
        sessionStorage.setItem('loginToastShown', 'true');
      }
    } else if (status === 'unauthenticated') {
      // Clear the flag on logout so next login shows toast
      sessionStorage.removeItem('loginToastShown');
    }
  }, [status]);

  const isCourier =
    (session?.data?.user as any)?.role === 'courier' || profileData?.role === 'courier';
  const isAdmin = (session?.data?.user as any)?.role === 'admin' || profileData?.role === 'admin';
  const isPublicRestaurantPage =
    pathname === '/restaurants' || Boolean(pathname && /^\/restaurants\/[^/]+$/.test(pathname));

  const handleLogout = async () => {
    toast.success('Successfully logged out', {
      style: { backgroundColor: '#22c55e', color: 'white' },
    });
    await signOut({ redirect: false });
    router.push('/');
  };

  return (
    <header className='fixed top-0 left-0 right-0 z-50 bg-background/90 border-b border-border shadow-sm backdrop-blur transition-colors'>
      <div className='flex items-center justify-between px-4 py-3 max-w-7xl mx-auto text-foreground'>
        <nav className='flex items-center gap-4 text-muted-foreground font-semibold'>
          <Link className='text-primary font-semibold text-2xl' href='/'>
            Pizza Hub
          </Link>
          <div className='hidden lg:flex items-center gap-3'>
            {status === 'loading' ? (
              <>
                <MenuLinkSkeleton />
                <AboutLinkSkeleton />
                <ContactLinkSkeleton />
                <MyOrdersLinkSkeleton />
                <MyDeliveryLinkSkeleton />
              </>
            ) : (
              <>
                <Link
                  className={`${pathname === '/menu' ? 'text-primary font-semibold' : ''}`}
                  href='/menu'
                >
                  Menu
                </Link>
                <Link
                  className={`${isPublicRestaurantPage ? 'text-primary font-semibold' : ''}`}
                  href='/restaurants'
                >
                  Restaurants
                </Link>
                <Link
                  className={`${pathname === '/about' ? 'text-primary font-semibold' : ''}`}
                  href='/about'
                >
                  About
                </Link>
                <Link
                  className={`${pathname === '/contact' ? 'text-primary font-semibold' : ''}`}
                  href='/contact'
                >
                  Contact
                </Link>
                {session.status === 'authenticated' && (
                  <>
                    <Link
                      className={`${pathname?.startsWith('/my-orders') ? 'text-primary font-semibold' : ''}`}
                      href={'/my-orders'}
                    >
                      My Orders
                    </Link>
                    <Link
                      className={`${pathname === '/favorite-meals' ? 'text-primary font-semibold' : ''}`}
                      href={'/favorite-meals'}
                    >
                      Favorite Meals
                    </Link>
                    <Link
                      className={`${pathname === '/favorite-restaurants' ? 'text-primary font-semibold' : ''}`}
                      href={'/favorite-restaurants'}
                    >
                      Favorite Restaurants
                    </Link>
                    <Link
                      className={`${pathname === '/loyalty' ? 'text-primary font-semibold' : ''}`}
                      href={'/loyalty'}
                    >
                      Loyalty
                    </Link>
                    {isCourier && (
                      <>
                        <Link
                          className={`${pathname === '/my-delivery' ? 'text-primary font-semibold' : ''}`}
                          href={'/my-delivery'}
                        >
                          My Delivery
                        </Link>
                        <Link
                          className={`${pathname === '/my-deliveries' ? 'text-primary font-semibold' : ''}`}
                          href={'/my-deliveries'}
                        >
                          My Deliveries
                        </Link>
                      </>
                    )}
                    {isAdmin && (
                      <Link
                        className={`${pathname?.startsWith('/admin-dashboard') ? 'text-primary font-semibold' : ''}`}
                        href={'/admin-dashboard'}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </nav>

        <nav className='hidden lg:flex items-center gap-2 text-muted-foreground font-semibold transition-colors'>
          {status === 'loading' ? (
            <>
              <ModeToggleSkeleton />
              <CartIconSkeleton />
              <UserNameSkeleton />
              <LogoutButtonSkeleton />
            </>
          ) : (
            <>
              <ModeToggle />
              <Link href='/cart' className='relative mr-2'>
                <IoCartOutline
                  size={32}
                  className='text-foreground hover:text-primary transition'
                />
                {totalItems > 0 && (
                  <span
                    aria-live='polite'
                    className={`absolute -top-2 -right-2 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold will-change-transform ${
                      bounce ? 'animate-bounce' : ''
                    }`}
                  >
                    {totalItems}
                  </span>
                )}
              </Link>

              {status === 'authenticated' && (
                <>
                  <Link className='whitespace-nowrap' href={'/profile'}>
                    {userName}
                  </Link>
                  <Button
                    onClick={handleLogout}
                    variant='outline'
                    size='default'
                    className='rounded-full'
                  >
                    Logout
                  </Button>
                </>
              )}

              {status === 'unauthenticated' && (
                <>
                  <Link href='/login'>
                    <Button size='default' className='rounded-full'>
                      Login
                    </Button>
                  </Link>
                  <Link href='/register'>
                    <Button variant='outline' size='default' className='rounded-full'>
                      Register
                    </Button>
                  </Link>
                </>
              )}
            </>
          )}
        </nav>

        <div className='lg:hidden'>
          <button
            aria-label='Toggle menu'
            className='inline-flex items-center justify-center p-1 rounded-md border border-border text-foreground hover:bg-muted h-8 w-8 transition-colors'
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className='sr-only'>Open main menu</span>
            <div className='flex flex-col gap-[3px]'>
              <span
                className={`block h-0.5 w-4 bg-current transition-transform ${
                  mobileOpen ? 'translate-y-1 rotate-45' : ''
                }`}
              ></span>
              <span
                className={`block h-0.5 w-4 bg-current transition-opacity ${
                  mobileOpen ? 'opacity-0' : 'opacity-100'
                }`}
              ></span>
              <span
                className={`block h-0.5 w-4 bg-current transition-transform ${
                  mobileOpen ? '-translate-y-1 -rotate-45' : ''
                }`}
              ></span>
            </div>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className='lg:hidden absolute left-4 right-4 top-full mt-2 rounded-xl border border-border bg-background shadow-lg z-50 transition-colors'>
          <div className='flex flex-col p-4 text-foreground font-semibold gap-3'>
            {status === 'authenticated' && (
              <Link
                className='whitespace-nowrap hover:text-primary'
                href={'/profile'}
                onClick={() => setMobileOpen(false)}
              >
                {userName}
              </Link>
            )}

            <Link
              href='/cart'
              onClick={() => setMobileOpen(false)}
              className='hover:text-primary flex items-center gap-2'
            >
              <IoCartOutline size={24} />
              Cart {totalItems > 0 && `(${totalItems})`}
            </Link>
            <Link href='/menu' onClick={() => setMobileOpen(false)} className='hover:text-primary'>
              Menu
            </Link>
            <Link
              href='/restaurants'
              onClick={() => setMobileOpen(false)}
              className='hover:text-primary'
            >
              Restaurants
            </Link>
            <Link href='/about' onClick={() => setMobileOpen(false)} className='hover:text-primary'>
              About
            </Link>
            <Link
              href='/contact'
              onClick={() => setMobileOpen(false)}
              className='hover:text-primary'
            >
              Contact
            </Link>

            {status === 'authenticated' && (
              <>
                <Link
                  href='/my-orders'
                  onClick={() => setMobileOpen(false)}
                  className='hover:text-primary'
                >
                  My Orders
                </Link>
                <Link
                  href='/favorite-meals'
                  onClick={() => setMobileOpen(false)}
                  className='hover:text-primary'
                >
                  Favorite Meals
                </Link>
                <Link
                  href='/favorite-restaurants'
                  onClick={() => setMobileOpen(false)}
                  className='hover:text-primary'
                >
                  Favorite Restaurants
                </Link>
                <Link
                  href='/loyalty'
                  onClick={() => setMobileOpen(false)}
                  className='hover:text-primary'
                >
                  Rewards
                </Link>
                {isCourier && (
                  <>
                    <Link
                      href='/courier'
                      onClick={() => setMobileOpen(false)}
                      className='hover:text-primary'
                    >
                      Courier
                    </Link>
                    <Link
                      href='/my-deliveries'
                      onClick={() => setMobileOpen(false)}
                      className='hover:text-primary'
                    >
                      My Deliveries
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <Link
                    href='/admin-dashboard'
                    onClick={() => setMobileOpen(false)}
                    className='hover:text-primary'
                  >
                    Admin Dashboard
                  </Link>
                )}
                <Button
                  onClick={async () => {
                    setMobileOpen(false);
                    await handleLogout();
                  }}
                  variant='outline'
                  size='default'
                  className='w-full rounded-full'
                >
                  Logout
                </Button>
              </>
            )}

            {status === 'unauthenticated' && (
              <>
                <Link href='/login' onClick={() => setMobileOpen(false)} className='w-full'>
                  <Button size='default' className='w-full rounded-full'>
                    Login
                  </Button>
                </Link>
                <Link href='/register' onClick={() => setMobileOpen(false)} className='w-full'>
                  <Button variant='outline' size='default' className='w-full rounded-full'>
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
