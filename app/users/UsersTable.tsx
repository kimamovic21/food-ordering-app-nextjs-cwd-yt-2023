import Image from 'next/image';

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
    <div className='rounded-xl border border-gray-200 bg-white shadow-sm'>
      <div className='overflow-x-auto'>
        <table className='min-w-full text-sm'>
          <thead className='bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600'>
            <tr>
              <th className='p-3'>Photo</th>
              <th className='p-3'>Name</th>
              <th className='p-3'>Email</th>
              <th className='p-3'>Phone</th>
              <th className='p-3'>Street address</th>
              <th className='p-3'>City / Postal</th>
              <th className='p-3'>Country</th>
              <th className='p-3'>Role</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-100'>
            {users.map((user) => (
              <tr key={user._id} className='hover:bg-gray-50'>
                <td className='p-3'>
                  <div className='w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center'>
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={`${user.name}'s avatar`}
                        width={48}
                        height={48}
                        className='w-12 h-12 rounded-full object-cover'
                        referrerPolicy='no-referrer'
                      />
                    ) : (
                      <Image
                        src={'/user-default-image.webp'}
                        alt={'Default avatar'}
                        width={48}
                        height={48}
                        className='w-12 h-12 rounded-full object-cover'
                        priority
                      />
                    )}
                  </div>
                </td>
                <td className='p-3 font-semibold text-gray-900'>{user.name}</td>
                <td className='p-3 text-gray-700'>{user.email}</td>
                <td className='p-3 text-gray-700'>{user.phone || '—'}</td>
                <td className='p-3 text-gray-700'>{user.streetAddress || '—'}</td>
                <td className='p-3 text-gray-700'>
                  {[user.city, user.postalCode].filter(Boolean).join(' ') || '—'}
                </td>
                <td className='p-3 text-gray-700'>{user.country || '—'}</td>
                <td className='p-3'>
                  <span className='px-2 py-1 rounded-full text-xs border border-gray-300 bg-gray-50'>
                    {user.admin ? 'Admin' : 'User'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTable;