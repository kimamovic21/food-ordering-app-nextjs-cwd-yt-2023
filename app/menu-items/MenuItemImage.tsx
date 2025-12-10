import Image from 'next/image';

interface MenuItemImageProps {
  imagePreview: string;
  image: string;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const MenuItemImage = ({
  imagePreview,
  image,
  onImageSelect,
  disabled
}: MenuItemImageProps) => {
  const displayImage = imagePreview || image;

  return (
    <div className='flex flex-col items-center'>
      <div className='relative w-28 h-28 md:w-32 md:h-32 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center'>
        {displayImage ? (
          <Image
            src={displayImage}
            alt='Menu item'
            fill
            className='object-cover'
          />
        ) : (
          <span className='text-gray-400 text-sm'>No image</span>
        )}

        <label className='absolute bottom-2 left-1/2 -translate-x-1/2 bg-white bg-opacity-70 px-2 py-1 rounded-lg text-sm cursor-pointer hover:bg-opacity-90'>
          <input
            type='file'
            className='hidden'
            onChange={onImageSelect}
            accept='image/*'
            disabled={disabled}
          />
          {displayImage ? 'Edit' : 'Upload'}
        </label>
      </div>
    </div>
  );
};

export default MenuItemImage;