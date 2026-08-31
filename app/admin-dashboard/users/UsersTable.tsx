'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';

import {
  createDataTableColumnHelper,
  TanStackDataTable,
  type DataTableColumnDef,
} from '@/components/shared/TanStackDataTable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { AdminUserListItem } from '@/types/user';

type UserRow = AdminUserListItem;

type UsersTableProps = {
  users: UserRow[];
};

const columnHelper = createDataTableColumnHelper<UserRow>();

function getUserRole(user: UserRow) {
  return (user.role || (user.admin ? 'admin' : 'user')).toLowerCase();
}

function RoleBadge({ role }: { role: string }) {
  const label = role.charAt(0).toUpperCase() + role.slice(1);
  const className =
    role === 'admin'
      ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100'
      : role === 'courier'
        ? 'bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-100'
        : '';

  return (
    <Badge variant='secondary' className={`${className} capitalize`}>
      {label}
    </Badge>
  );
}

const usersTableColumns = columnHelper.columns([
  columnHelper.accessor((user) => user._id, {
    id: 'id',
    header: 'ID',
    cell: ({ row }) => (
      <span className='font-mono text-xs text-muted-foreground'>{row.original._id.slice(-8)}</span>
    ),
  }),
  columnHelper.display({
    id: 'photo',
    header: 'Photo',
    cell: ({ row }) => (
      <Avatar className='size-12'>
        <AvatarImage
          src={row.original.image || '/user-default-image.webp'}
          alt={`${row.original.name}'s avatar`}
          referrerPolicy='no-referrer'
        />
        <AvatarFallback className='text-xs text-gray-400 dark:text-gray-500'>
          {row.original.name?.charAt(0).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
    ),
    enableGlobalFilter: false,
    enableSorting: false,
  }),
  columnHelper.accessor((user) => user.name, {
    id: 'name',
    header: 'Name',
    cell: ({ getValue }) => <span className='font-semibold'>{getValue()}</span>,
  }),
  columnHelper.accessor((user) => user.email, {
    id: 'email',
    header: 'Email',
    cell: ({ getValue }) => <span className='text-muted-foreground'>{getValue()}</span>,
  }),
  columnHelper.accessor((user) => getUserRole(user), {
    id: 'role',
    header: 'Role',
    cell: ({ row }) => <RoleBadge role={getUserRole(row.original)} />,
  }),
  columnHelper.accessor((user) => user.phone || '', {
    id: 'phone',
    header: 'Phone',
    cell: ({ getValue }) => <span className='text-muted-foreground'>{getValue() || '-'}</span>,
  }),
  columnHelper.accessor((user) => user.streetAddress || '', {
    id: 'streetAddress',
    header: 'Street address',
    cell: ({ getValue }) => <span className='text-muted-foreground'>{getValue() || '-'}</span>,
  }),
  columnHelper.accessor((user) => [user.city, user.postalCode].filter(Boolean).join(' '), {
    id: 'cityPostal',
    header: 'City / Postal',
    cell: ({ getValue }) => <span className='text-muted-foreground'>{getValue() || '-'}</span>,
  }),
  columnHelper.accessor((user) => user.country || '', {
    id: 'country',
    header: 'Country',
    cell: ({ getValue }) => <span className='text-muted-foreground'>{getValue() || '-'}</span>,
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <Link
        href={`/admin-dashboard/users/${row.original._id}`}
        aria-label='Edit user'
        className='inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-primary/10 hover:text-primary'
      >
        <Pencil className='size-4' aria-hidden='true' />
      </Link>
    ),
    enableGlobalFilter: false,
    enableHiding: false,
    enableSorting: false,
  }),
]) satisfies DataTableColumnDef<UserRow>[];

const userColumnLabels = {
  actions: 'Actions',
  cityPostal: 'City / Postal',
  country: 'Country',
  email: 'Email',
  id: 'ID',
  name: 'Name',
  phone: 'Phone',
  photo: 'Photo',
  role: 'Role',
  streetAddress: 'Street address',
};

const UsersTable = ({ users }: UsersTableProps) => {
  return (
    <TanStackDataTable
      columns={usersTableColumns}
      data={users}
      tableKey='admin-users'
      searchPlaceholder='Search users by name, email, role, or city...'
      emptyMessage='No users found.'
      minWidthClassName='min-w-[1200px]'
      columnLabels={userColumnLabels}
    />
  );
};

export default UsersTable;
