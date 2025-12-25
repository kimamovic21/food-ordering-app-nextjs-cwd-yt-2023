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
  admin?: boolean;
};

type UsersTableProps = {
  users: UserRow[];
};

const UsersTable = ({ users }: UsersTableProps) => {
  return (
    <div className='border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-950 shadow-sm'>
      <div className='overflow-x-auto'>
        <Table className='w-full min-w-[1100px] table-fixed'>
          <TableHeader className='bg-gray-50 dark:bg-slate-900 text-left text-xs uppercase tracking-wide text-gray-600 dark:text-gray-300'>
            <TableRow>
              <TableHead className='p-3 w-28'>Photo</TableHead>
              <TableHead className='p-3 w-40'>Name</TableHead>
              <TableHead className='p-3 w-56'>Email</TableHead>
              <TableHead className='p-3 w-36'>Phone</TableHead>
              <TableHead className='p-3 w-52'>Street address</TableHead>
              <TableHead className='p-3 w-44'>City / Postal</TableHead>
              <TableHead className='p-3 w-36'>Country</TableHead>
              <TableHead className='p-3 w-24'>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className='divide-y divide-gray-100 dark:divide-gray-700'>
            {users.map((user) => (
              <TableRow key={user._id} className='hover:bg-gray-50 dark:hover:bg-slate-900'>
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
                <TableCell className='p-3 font-semibold text-gray-900 dark:text-gray-100'>{user.name}</TableCell>
                <TableCell className='p-3 text-gray-700 dark:text-gray-300'>{user.email}</TableCell>
                <TableCell className='p-3 text-gray-700 dark:text-gray-300'>{user.phone || '—'}</TableCell>
                <TableCell className='p-3 text-gray-700 dark:text-gray-300'>{user.streetAddress || '—'}</TableCell>
                <TableCell className='p-3 text-gray-700 dark:text-gray-300'>
                  {[user.city, user.postalCode].filter(Boolean).join(' ') || '—'}
                </TableCell>
                <TableCell className='p-3 text-gray-700 dark:text-gray-300'>{user.country || '—'}</TableCell>
                <TableCell className='p-3'>
                  <Badge variant={user.admin ? 'default' : 'secondary'}>
                    {user.admin ? 'Admin' : 'User'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UsersTable;