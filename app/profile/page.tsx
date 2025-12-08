'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import UserTabs from '@/components/shared/UserTabs';

interface ExtendedUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  phone?: string | null;
  streetAddress?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  admin?: boolean | null;
};

const ProfilePage = () => {
  const session = useSession();
  const { status } = session;

  const [userName, setUserName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session.data?.user) {
      const user = session.data.user as ExtendedUser;

      Promise.resolve().then(() => {
        setUserName(user.name || '');
        setPhone(user.phone || '');
        setStreetAddress(user.streetAddress || '');
        setPostalCode(user.postalCode || '');
        setCity(user.city || '');
        setCountry(user.country || '');
        setIsAdmin(user.admin || false);
      });
    }
  }, [status, session.data?.user]);

  if (status === 'loading') return 'Loading...';
  if (status === 'unauthenticated') return redirect('/login');

  const userImage = session.data?.user?.image;

  const handleProfileInfoUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    const updatePromise = fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: userName,
        phone,
        streetAddress,
        postalCode,
        city,
        country,
        admin: isAdmin,
      }),
    });

    toast.promise(updatePromise, {
      loading: 'Saving profile...',
      success: 'Profile updated!',
      error: 'Failed to update profile.',
    });

    const res = await updatePromise;
    const updatedUser = await res.json();

    await session.update({
      name: updatedUser.name,
      phone: updatedUser.phone,
      streetAddress: updatedUser.streetAddress,
      postalCode: updatedUser.postalCode,
      city: updatedUser.city,
      country: updatedUser.country,
    });

    setIsSaving(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length !== 1) return;

    const data = new FormData();
    data.append('file', files[0]);

    const uploadPromise = fetch('/api/upload', {
      method: 'POST',
      body: data,
    }).then(async (res) => {
      const json = await res.json();

      if (json.url) {
        await session.update({
          ...session.data,
          user: {
            ...session.data?.user,
            image: json.url,
          },
        });
      };

      return json;
    });

    toast.promise(uploadPromise, {
      loading: 'Uploading image...',
      success: 'Image updated!',
      error: 'Image upload failed.',
    });
  };

  return (
    <section className='mt-8 w-lg'>
      <UserTabs isAdmin={isAdmin} />

      <div className='max-w-md mx-auto mt-8'>
        <div className='flex gap-4 items-start'>
          <div className='flex flex-col items-center'>
            <div className='relative w-28 h-28 md:w-32 md:h-32 rounded-lg overflow-hidden'>
              {userImage && (
                <Image
                  src={userImage}
                  alt='User image'
                  fill
                  className='object-cover'
                />
              )}

              <label className='absolute bottom-2 left-1/2 -translate-x-1/2 bg-white bg-opacity-70 px-2 py-1 rounded-lg text-sm cursor-pointer hover:bg-opacity-90'>
                <input
                  id='imageFile'
                  type='file'
                  className='hidden'
                  onChange={handleFileChange}
                />
                Edit
              </label>
            </div>
          </div>

          <form className='grow' onSubmit={handleProfileInfoUpdate}>
            <input
              type='text'
              placeholder='First and last name'
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              disabled={isSaving}
            />

            <input type='email' disabled value={session.data?.user?.email || ''} />

            <input
              type='tel'
              placeholder='Phone number'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <input
              type='text'
              placeholder='Street address'
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
            />

            <div className='flex gap-4'>
              <input
                type='text'
                placeholder='City'
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />

              <input
                type='text'
                placeholder='Postal code'
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
              />
            </div>

            <input
              type='text'
              placeholder='Country'
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />

            <button type='submit'>Save</button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;