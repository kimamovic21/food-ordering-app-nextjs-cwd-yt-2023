'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface UserTabsProps {
  isAdmin?: boolean;
};

const UserTabs = ({ isAdmin = false }: UserTabsProps) => {
  const path = usePathname();

  return (
    <div className='flex justify-center gap-2 tabs'>
      <Link
        className={path === '/profile' ? 'active' : ''}
        href={'/profile'}
      >
        Profile
      </Link>

      {isAdmin && (
        <>
          <Link
            className={path === '/categories' ? 'active' : ''}
            href={'/categories'}
          >
            Categories
          </Link>
          <Link
            className={path === '/menu-items' ? 'active' : ''}
            href={'/menu-items'}
          >
            Menu Items
          </Link>
          <Link
            className={path === '/users' ? 'active' : ''}
            href={'/users'}
          >
            Users
          </Link>
        </>
      )}
    </div>
  );
};

export default UserTabs