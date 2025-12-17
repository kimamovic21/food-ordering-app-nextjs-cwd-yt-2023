'use client'

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { IoCartOutline } from 'react-icons/io5';
import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';

const Header = () => {
  const session = useSession();
  const { getTotalItems } = useCart();

  const status = session.status;
  const userData = session?.data?.user;
  let userName = userData?.name || userData?.email;

  if (userName && userName?.includes(' ')) {
    userName = userName.split(' ')[0];
  };

  const [mobileOpen, setMobileOpen] = useState(false);
  const totalItems = getTotalItems();

  return (
    <header className='flex items-center justify-between m-4 relative'>
      <nav className='flex items-center gap-8 text-gray-500 font-semibold'>
        <Link
          className='text-primary font-semibold text-2xl'
          href='/'
        >
          Pizza Hub
        </Link>
        <div className='hidden md:flex items-center gap-8'>
          <Link href='/menu'>Menu</Link>
          <Link href='/about'>About</Link>
          <Link href='/contact'>Contact</Link>
        </div>
      </nav>

      <nav className='hidden md:flex items-center gap-2 text-gray-500 font-semibold'>
        <Link href='/cart' className='relative mr-2'>
          <IoCartOutline size={32} className='text-gray-700 hover:text-primary transition' />
          {totalItems > 0 && (
            <span className='absolute -top-2 -right-2 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold'>
              {totalItems}
            </span>
          )}
        </Link>

        {status === 'authenticated' && (
          <>
            <Link
              className='whitespace-nowrap'
              href={'/profile'}
            >
              Hello, {userName}
            </Link>
            <button
              onClick={() => signOut()}
              className='bg-white border-2 border-primary text-primary px-4 py-2 rounded-full hover:bg-gray-100'
            >
              Logout
            </button>
          </>
        )}

        {status === 'unauthenticated' && (
          <>
            <Link
              href='/login'
              className='bg-primary text-white px-4 py-2 rounded-full hover:bg-orange-700'
            >
              Login
            </Link>
            <Link
              href='/register'
              className='bg-white border-2 border-primary text-primary px-4 py-2 rounded-full hover:bg-gray-100'
            >
              Register
            </Link>
          </>
        )}
      </nav>

      <div className='md:hidden'>
        <button
          aria-label='Toggle menu'
          className='inline-flex items-center justify-center p-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 h-8 w-8'
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span className='sr-only'>Open main menu</span>
          <div className='flex flex-col gap-[3px]'>
            <span className={`block h-0.5 w-4 bg-current transition-transform ${mobileOpen ? 'translate-y-1 rotate-45' : ''}`}></span>
            <span className={`block h-0.5 w-4 bg-current transition-opacity ${mobileOpen ? 'opacity-0' : 'opacity-100'}`}></span>
            <span className={`block h-0.5 w-4 bg-current transition-transform ${mobileOpen ? '-translate-y-1 -rotate-45' : ''}`}></span>
          </div>
        </button>
      </div>

      {mobileOpen && (
        <div className='md:hidden absolute left-0 right-0 top-full mt-2 mx-4 rounded-xl border border-gray-200 bg-white shadow-lg z-50'>
          <div className='flex flex-col p-4 text-gray-700 font-semibold gap-3'>
            <Link href='/cart' onClick={() => setMobileOpen(false)} className='hover:text-primary flex items-center gap-2'>
              <IoCartOutline size={24} />
              Cart {totalItems > 0 && `(${totalItems})`}
            </Link>
            <Link href='/menu' onClick={() => setMobileOpen(false)} className='hover:text-primary'>Menu</Link>
            <Link href='/about' onClick={() => setMobileOpen(false)} className='hover:text-primary'>About</Link>
            <Link href='/contact' onClick={() => setMobileOpen(false)} className='hover:text-primary'>Contact</Link>

            <div className='h-px bg-gray-200 my-2'></div>

            {status === 'authenticated' && (
              <>
                <Link
                  className='whitespace-nowrap hover:text-primary'
                  href={'/profile'}
                  onClick={() => setMobileOpen(false)}
                >
                  Hello, {userName}
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); signOut(); }}
                  className='bg-white border-2 border-primary text-primary px-4 py-2 rounded-full hover:bg-gray-100'
                >
                  Logout
                </button>
              </>
            )}

            {status === 'unauthenticated' && (
              <>
                <Link
                  href='/login'
                  onClick={() => setMobileOpen(false)}
                  className='bg-primary text-white px-4 py-2 rounded-full hover:bg-orange-700 text-center'
                >
                  Login
                </Link>
                <Link
                  href='/register'
                  onClick={() => setMobileOpen(false)}
                  className='bg-white border-2 border-primary text-primary px-4 py-2 rounded-full hover:bg-gray-100 text-center'
                >
                  Register
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