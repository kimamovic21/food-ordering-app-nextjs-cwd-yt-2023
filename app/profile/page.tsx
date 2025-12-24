'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import toast from 'react-hot-toast';
import UserTabs from '@/components/shared/UserTabs';
import UserProfileForm from './UserProfileForm';
import UserProfileImage from './UserProfileImage';

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

const FALLBACK_IMAGE = '/user-default-image.webp';

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
  const [imageUrl, setImageUrl] = useState<string>(FALLBACK_IMAGE);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRemovingImage, setIsRemovingImage] = useState(false);

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
        setImageUrl(user.image || FALLBACK_IMAGE);
      });
    }
  }, [status, session.data?.user]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  if (status === 'loading') return 'Loading...';
  if (status === 'unauthenticated') return redirect('/login');

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

  const handleProfileSave = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
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

    toast.promise(savePromise, {
      loading: 'Saving profile...',
      success: 'Profile updated!',
      error: (err) =>
        err instanceof Error ? err.message : 'Failed to update profile.',
    });

    try {
      await savePromise;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className='mt-8 max-w-2xl mx-auto'>
      <UserTabs isAdmin={isAdmin} />

      <div className='max-w-2xl mx-auto mt-8'>
        <div className='flex gap-4 items-start'>
          <UserProfileImage
            imageUrl={imageUrl}
            previewUrl={previewUrl}
            isRemovingImage={isRemovingImage}
            onSelectImage={handleImageSelect}
            onRemoveImage={handleRemoveImage}
            isSaving={isSaving}
          />

          <UserProfileForm
            userName={userName}
            email={session.data?.user?.email}
            phone={phone}
            streetAddress={streetAddress}
            postalCode={postalCode}
            city={city}
            country={country}
            isSaving={isSaving}
            onSubmit={handleProfileSave}
            onNameChange={setUserName}
            onPhoneChange={setPhone}
            onStreetAddressChange={setStreetAddress}
            onPostalCodeChange={setPostalCode}
            onCityChange={setCity}
            onCountryChange={setCountry}
          />
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;