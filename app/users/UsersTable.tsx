import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Pencil } from 'lucide-react';
import Link from 'next/link';

type UserRow = {
  _id: string;
  name: string;
  email: string;
  image?: string;
  city?: string;
  country?: string;
  phone?: string;
  postalCode?: string;
  streetAddress?: string;
  role?: string;
  admin?: boolean; // some APIs return boolean admin instead of string role
};

type UsersTableProps = {
  users: UserRow[];
};

const UsersTable = ({ users }: UsersTableProps) => {
  return (
    <div className='overflow-x-auto'>
      <Table className='w-full min-w-[1200px] table-fixed'>
        <TableHeader className='bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground'>
          <TableRow>
            <TableHead className='p-3 w-32'>ID</TableHead>
            <TableHead className='p-3 w-28'>Photo</TableHead>
            <TableHead className='p-3 w-40'>Name</TableHead>
            <TableHead className='p-3 w-56'>Email</TableHead>
            <TableHead className='p-3 w-24'>Role</TableHead>
            <TableHead className='p-3 w-36'>Phone</TableHead>
            <TableHead className='p-3 w-52'>Street address</TableHead>
            <TableHead className='p-3 w-44'>City / Postal</TableHead>
            <TableHead className='p-3 w-44'>Country</TableHead>
            <TableHead className='p-3 w-28'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className='divide-y divide-gray-100 dark:divide-gray-700'>
          {users.map((user) => (
            <TableRow
              key={user._id}
              className='bg-white hover:bg-gray-50 dark:bg-neutral-900 dark:hover:bg-neutral-800'
            >
              <TableCell className='p-3 text-gray-600 dark:text-gray-400 text-sm font-mono'>
                {user._id.slice(-8)}
              </TableCell>
              <TableCell className='p-3'>
                <Avatar className='size-12'>
                  <AvatarImage
                    src={user.image || '/user-default-image.webp'}
                    alt={`${user.name}'s avatar`}
                    referrerPolicy='no-referrer'
                  />
                  <AvatarFallback className='text-gray-400 dark:text-gray-500 text-xs'>
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className='p-3 font-semibold text-gray-900 dark:text-gray-100'>
                {user.name}
              </TableCell>
              <TableCell className='p-3 text-gray-700 dark:text-gray-300'>{user.email}</TableCell>
              <TableCell className='p-3'>
                {(() => {
                  const role = (user.role || (user.admin ? 'admin' : 'user')).toLowerCase();
                  const label = role.charAt(0).toUpperCase() + role.slice(1);

                  let className = 'capitalize';
                  if (role === 'admin') {
                    className +=
                      ' bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100';
                  } else if (role === 'courier') {
                    className +=
                      ' bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-100';
                  }

                  return (
                    <Badge variant='secondary' className={className}>
                      {label}
                    </Badge>
                  );
                })()}
              </TableCell>
              <TableCell className='p-3 text-gray-700 dark:text-gray-300'>
                {user.phone || '—'}
              </TableCell>
              <TableCell className='p-3 text-gray-700 dark:text-gray-300'>
                {user.streetAddress || '—'}
              </TableCell>
              <TableCell className='p-3 text-gray-700 dark:text-gray-300'>
                {[user.city, user.postalCode].filter(Boolean).join(' ') || '—'}
              </TableCell>
              <TableCell className='p-3 text-gray-700 dark:text-gray-300'>
                <span className='pr-4'>{user.country || '—'}</span>
              </TableCell>
              <TableCell className='p-3'>
                <Link href={`/users/${user._id}`}>
                  <Pencil className='size-4' />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UsersTable;
