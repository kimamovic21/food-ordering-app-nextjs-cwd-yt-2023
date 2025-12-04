'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Image from 'next/image';

const ProfilePage = () => {
  const session = useSession();
  const { status } = session;

  const [userName, setUserName] = useState('');
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageSaved, setImageSaved] = useState(false);
  const [imageIsUploading, setImageIsUploading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      setUserName(session?.data?.user?.name || '');
    };
  }, [status, session]);

  if (status === 'loading') return 'Loading...';
  if (status === 'unauthenticated') return redirect('/login');

  const userImage = session?.data?.user?.image;

  const handleProfileInfoUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setSaved(false);
    setIsSaving(true);

    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: userName }),
    });

    setIsSaving(false);

    if (response.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (files && files.length === 1) {
      setImageIsUploading(true);

      const data = new FormData();
      data.append('file', files[0]);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });

      const json = await res.json();

      if (json.url) {
        await session.update({
          ...session.data,
          user: {
            ...session.data?.user,
            image: json.url,
          },
        });

        setImageSaved(true);
        setTimeout(() => setImageSaved(false), 3000);
      };

      setImageIsUploading(false);
    };
  };

  return (
    <section className='mt-8 w-lg'>
      <h2 className='text-center text-primary text-4xl mb-4'>
        Profile
      </h2>

      <div className='max-w-md mx-auto'>
        {saved && (
          <h2 className='text-center bg-green-200 p-4 rounded-lg border-green-300 border-4 mb-4'>
            Profile saved!
          </h2>
        )}

        {imageSaved && (
          <h2 className='text-center bg-green-200 p-4 rounded-lg border-green-300 border-4 mb-4'>
            Image updated successfully!
          </h2>
        )}

        {isSaving && (
          <h2 className='text-center bg-blue-200 p-4 rounded-lg border-blue-300 border-4 mb-4'>
            Saving...
          </h2>
        )}

        {imageIsUploading && (
          <h2 className='text-center bg-blue-200 p-4 rounded-lg border-blue-300 border-4 mb-4'>
            Uploading image...
          </h2>
        )}

        <div className='flex gap-4 items-center'>
          <div className='relative w-28 h-28 md:w-32 md:h-32 rounded-lg overflow-hidden'>
            {userImage && (
              <Image
                src={userImage}
                alt='User image'
                fill
                className='object-cover'
              />
            )}

            <label
              className={`absolute bottom-2 left-1/2 -translate-x-1/2 bg-white bg-opacity-70 px-2 py-1 rounded-lg text-sm
                ${imageIsUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-opacity-90'}`}
            >
              <input
                type='file'
                className='hidden'
                onChange={handleFileChange}
                disabled={imageIsUploading}
              />
              {imageIsUploading ? 'Uploading...' : 'Edit'}
            </label>
          </div>

          <form className='grow' onSubmit={handleProfileInfoUpdate}>
            <input
              type='text'
              placeholder='First and last name'
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              disabled={isSaving}
            />

            <input
              type='email'
              disabled
              value={session?.data?.user?.email || ''}
            />

            <button type='submit'>
              Save
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;