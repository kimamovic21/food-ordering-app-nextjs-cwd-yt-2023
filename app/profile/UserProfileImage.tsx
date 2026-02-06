'use client';

import { ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

type UserProfileImageProps = {
  imageUrl?: string | null;
  previewUrl?: string | null;
  isRemovingImage?: boolean;
  onSelectImage: (file: File) => void;
  onRemoveImage: () => void;
  isSaving?: boolean;
};

const UserProfileImage = ({
  imageUrl,
  previewUrl,
  isRemovingImage,
  onSelectImage,
  onRemoveImage,
  isSaving,
}: UserProfileImageProps) => {
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
      <div className='relative w-32 h-32 md:w-36 md:h-36 rounded-md overflow-hidden bg-muted/30 shadow-sm'>
        <Image src={displaySrc} alt='User image' fill className='object-cover' />

        <label className='absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/90 px-2 py-1 rounded-lg text-sm cursor-pointer hover:bg-background'>
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
        <Button
          type='button'
          onClick={onRemoveImage}
          disabled={isSaving || isRemovingImage}
          variant='destructive'
          size='sm'
          className='mt-2 bg-red-500! hover:bg-red-600! dark:bg-red-500! dark:hover:bg-red-600!'
        >
          Remove Image
        </Button>
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
