'use client';

import Image from 'next/image';
import { ChangeEvent } from 'react';

type UserProfileImageProps = {
  imageUrl?: string | null;
  previewUrl?: string | null;
  isRemovingImage?: boolean;
  onSelectImage: (file: File) => void;
  onRemoveImage: () => void;
  isSaving?: boolean;
};

const UserProfileImage = ({ imageUrl, previewUrl, isRemovingImage, onSelectImage, onRemoveImage, isSaving }: UserProfileImageProps) => {
  const displaySrc = previewUrl || imageUrl || '/user-default-image.webp';
  const hasRealImage = imageUrl && imageUrl !== '/user-default-image.webp';

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectImage(file);
    }
  };

  return (
    <div className='flex flex-col items-center'>
      <div className='relative w-28 h-28 md:w-32 md:h-32 rounded-md overflow-hidden'>
        <Image
          src={displaySrc}
          alt='User image'
          fill
          className='object-cover'
        />

        <label className='absolute bottom-2 left-1/2 -translate-x-1/2 bg-white bg-opacity-70 px-2 py-1 rounded-lg text-sm cursor-pointer hover:bg-opacity-90'>
          <input
            id='imageFile'
            type='file'
            accept='image/*'
            className='hidden'
            onChange={handleFileChange}
            disabled={isSaving || isRemovingImage}
          />
          Update
        </label>
      </div>

      {hasRealImage && (
        <button
          type='button'
          onClick={onRemoveImage}
          disabled={isSaving || isRemovingImage}
          className='mt-2 text-sm text-red-500 hover:text-red-700 disabled:text-gray-400'
        >
          Remove Image
        </button>
      )}

      {(previewUrl || isRemovingImage) && (
        <p className='text-xs text-gray-500 mt-2'>
          {isRemovingImage ? 'Image will be removed, click Save' : 'Pending change, click Save'}
        </p>
      )}
    </div>
  );
};

export default UserProfileImage;