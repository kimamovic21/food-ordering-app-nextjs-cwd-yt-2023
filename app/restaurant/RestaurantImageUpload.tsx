'use client';

import { ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

type RestaurantImageUploadProps = {
  imageUrl?: string | null;
  previewUrl?: string | null;
  isRemovingImage?: boolean;
  onSelectImage: (file: File) => void;
  onRemoveImage: () => void;
  isSaving?: boolean;
  isRequired?: boolean;
};

const RestaurantImageUpload = ({
  imageUrl,
  previewUrl,
  isRemovingImage,
  onSelectImage,
  onRemoveImage,
  isSaving,
  isRequired = false,
}: RestaurantImageUploadProps) => {
  const displaySrc = previewUrl || imageUrl;
  const hasRealImage = imageUrl && imageUrl.trim() !== '';

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectImage(file);
    }
  };

  return (
    <div className='flex flex-col items-center'>
      <div className='relative w-48 h-48 md:w-56 md:h-56 rounded-md overflow-hidden bg-slate-800 shadow-sm'>
        {displaySrc ? (
          <Image src={displaySrc} alt='Restaurant image' fill className='object-cover' />
        ) : (
          <div className='w-full h-full flex items-center justify-center bg-slate-800' />
        )}

        <label className='absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/90 px-2 py-1 rounded-lg text-sm cursor-pointer hover:bg-background'>
          <input
            id='restaurantImageFile'
            type='file'
            accept='image/*'
            className='hidden'
            onChange={handleFileChange}
            disabled={isSaving || isRemovingImage}
          />
          Upload
        </label>
      </div>

      {hasRealImage && (
        <Button
          type='button'
          onClick={onRemoveImage}
          disabled={isSaving || isRemovingImage || isRequired}
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

      {isRequired && !hasRealImage && (
        <p className='text-xs text-red-500 mt-2'>Image is required</p>
      )}
    </div>
  );
};

export default RestaurantImageUpload;
