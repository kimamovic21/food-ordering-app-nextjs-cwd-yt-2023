'use client'

import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

const Header = () => {
  const session = useSession();

  const status = session.status;
  const userData = session?.data?.user;
  let userName = userData?.name || userData?.email;

  if (userName && userName?.includes(' ')) {
    userName = userName.split(' ')[0];
  };

  return (
    <header className='flex items-center justify-between m-4'>
      <nav className='flex items-center gap-8 text-gray-500 font-semibold'>
        <Link
          className='text-primary font-semibold text-2xl'
          href='/'
        >
          Pizza Hub
        </Link>
        <Link href='/'>Home</Link>
        <Link href='/menu'>Menu</Link>
        <Link href='/about'>About</Link>
        <Link href='/contact'>Contact</Link>
      </nav>

      <nav className='flex items-center gap-2 text-gray-500 font-semibold'>
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
    </header>
  );
};

export default Header;