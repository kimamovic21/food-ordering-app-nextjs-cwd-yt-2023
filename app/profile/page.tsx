'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
import type { ExtendedUser } from '@/types/user';
import Title from '@/components/shared/Title';
import UserProfileForm from './UserProfileForm';
import UserProfileImage from './UserProfileImage';
import ProfilePageLoading from './loading';

const FALLBACK_IMAGE = '/user-default-image.webp';

const ProfilePage = () => {
  const session = useSession();
  const { status } = session;
  const router = useRouter();

  const [userName, setUserName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>(FALLBACK_IMAGE);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRemovingImage, setIsRemovingImage] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInitialSessionLoading, setIsInitialSessionLoading] = useState(true);

  useEffect(() => {
    if (status !== 'loading') {
      setIsInitialSessionLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

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
        setIsAdmin(user.role === 'admin');
        setImageUrl(user.image || FALLBACK_IMAGE);
      });
    }
  }, [status, session.data?.user]);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  if (status === 'loading' && isInitialSessionLoading) {
    return <ProfilePageLoading />;
  }
  if (status === 'unauthenticated') return null;

  const handleImageSelect = (file: File) => {
    setSelectedImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setIsRemovingImage(false);
  };

  const handleRemoveImage = () => {
    setIsRemovingImage(true);
    setSelectedImageFile(null);
    setPreviewUrl(null);
  };

  const handleProfileSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    const savePromise = (async () => {
      let nextImageUrl = imageUrl || FALLBACK_IMAGE;

      if (isRemovingImage && imageUrl && imageUrl !== FALLBACK_IMAGE) {
        const deleteRes = await fetch('/api/upload/users', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl }),
        });

        if (!deleteRes.ok) {
          const message = await deleteRes.text();
          throw new Error(message || 'Image deletion failed.');
        }

        nextImageUrl = '';
      } else if (selectedImageFile) {
        const data = new FormData();
        data.append('file', selectedImageFile);

        const uploadRes = await fetch('/api/upload/users', {
          method: 'POST',
          body: data,
        });

        if (!uploadRes.ok) {
          const message = await uploadRes.text();
          throw new Error(message || 'Image upload failed.');
        }

        const uploadJson = await uploadRes.json();
        if (uploadJson?.url) {
          nextImageUrl = uploadJson.url;
        }
      }

      const profileRes = await fetch('/api/profile', {
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

      if (!profileRes.ok) {
        const message = await profileRes.text();
        throw new Error(message || 'Failed to update profile.');
      }

      const updatedUser = await profileRes.json();

      await session.update({
        ...session.data,
        user: {
          ...session.data?.user,
          name: updatedUser.name,
          phone: updatedUser.phone,
          streetAddress: updatedUser.streetAddress,
          postalCode: updatedUser.postalCode,
          city: updatedUser.city,
          country: updatedUser.country,
          image: nextImageUrl,
        },
      });

      setImageUrl(nextImageUrl || FALLBACK_IMAGE);
      setSelectedImageFile(null);
      setPreviewUrl(null);
      setIsRemovingImage(false);

      return updatedUser;
    })();

    sonnerToast.promise(savePromise, {
      loading: 'Saving profile...',
      success: 'Profile updated!',
      error: (err) => (err instanceof Error ? err.message : 'Failed to update profile.'),
      style: {
        background: '#22c55e', // Tailwind green-500
        color: 'white',
      },
    });

    try {
      await savePromise;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);

    const deletePromise = (async () => {
      const deleteRes = await fetch('/api/profile', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!deleteRes.ok) {
        const message = await deleteRes.text();
        throw new Error(message || 'Failed to delete account.');
      }

      // Sign out the user after successful account deletion
      await signOut({ callbackUrl: '/login' });

      return deleteRes.json();
    })();

    sonnerToast.promise(deletePromise, {
      loading: 'Deleting account...',
      success: 'Account deleted successfully!',
      error: (err) => (err instanceof Error ? err.message : 'Failed to delete account.'),
      style: {
        background: '#22c55e', // Tailwind green-500
        color: 'white',
      },
    });

    try {
      await deletePromise;
    } catch (error) {
      console.error('Account deletion error:', error);
      setIsDeleting(false);
    }
  };

  return (
    <section className='mt-8 max-w-5xl mx-auto'>
      <Title className='text-center'>Profile</Title>

      <div className='max-w-3xl mx-auto mt-8'>
        <div className='flex flex-col md:flex-row gap-4 md:items-start'>
          <UserProfileImage
            imageUrl={imageUrl}
            previewUrl={previewUrl}
            isRemovingImage={isRemovingImage}
            onSelectImage={handleImageSelect}
            onRemoveImage={handleRemoveImage}
            isSaving={isSaving}
          />

          <div className='w-full md:w-[560px]'>
            <UserProfileForm
              userName={userName}
              email={session.data?.user?.email}
              phone={phone}
              streetAddress={streetAddress}
              postalCode={postalCode}
              city={city}
              country={country}
              provider={(session.data?.user as any)?.provider}
              isSaving={isSaving}
              onSubmit={handleProfileSave}
              onNameChange={setUserName}
              onPhoneChange={setPhone}
              onStreetAddressChange={setStreetAddress}
              onPostalCodeChange={setPostalCode}
              onCityChange={setCity}
              onCountryChange={setCountry}
              onDeleteAccount={handleDeleteAccount}
              isDeleting={isDeleting}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;
