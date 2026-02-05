import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

interface MenuItemImageProps {
  imagePreview: string;
  image: string;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const MenuItemImage = ({ imagePreview, image, onImageSelect, disabled }: MenuItemImageProps) => {
  const displayImage = imagePreview || image;
  const isValidImage =
    (displayImage && typeof displayImage === 'string' && displayImage.startsWith('http')) ||
    displayImage?.startsWith('data:');

  return (
    <div className='flex flex-col items-center gap-3'>
      <div className='relative w-28 h-28 md:w-36 md:h-36 lg:w-64 lg:h-64 rounded-lg overflow-hidden bg-muted flex items-center justify-center'>
        {isValidImage ? (
          <Image
            src={displayImage}
            alt='Menu item'
            fill
            className='object-cover'
            onError={() => {
              console.warn(`Failed to load preview image: ${displayImage}`);
            }}
          />
        ) : (
          <span className='text-muted-foreground text-sm'>No image</span>
        )}
      </div>

      <input
        id='menu-item-image'
        type='file'
        className='hidden'
        onChange={onImageSelect}
        accept='image/*'
        disabled={disabled}
      />
      <Button asChild size='sm' variant='outline'>
        <Label htmlFor='menu-item-image'>{displayImage ? 'Edit' : 'Upload'}</Label>
      </Button>
    </div>
  );
};

export default MenuItemImage;
