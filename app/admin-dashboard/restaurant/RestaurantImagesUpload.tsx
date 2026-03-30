'use client';

import { ChangeEvent, useEffect } from 'react';
import { X, Upload, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from 'next/image';

export type ImageItem = {
  id: string;
  type: 'url' | 'file';
  url: string; // Either Cloudinary URL or local preview URL
  file?: File; // Only present when type is 'file'
};

type RestaurantImagesUploadProps = {
  imageItems: ImageItem[];
  onImageItemsChange: (items: ImageItem[]) => void;
  isSaving?: boolean;
  maxImages?: number;
};

interface SortableImageItemProps {
  id: string;
  imageItem: ImageItem;
  index: number;
  onRemove: (id: string) => void;
  disabled: boolean;
}

function SortableImageItem({ id, imageItem, index, onRemove, disabled }: SortableImageItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='relative group bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-700 hover:border-slate-500'
    >
      <div className='relative w-full h-40'>
        <Image
          src={imageItem.url}
          alt={`Restaurant image ${index + 1}`}
          fill
          className='object-cover'
        />
        {index === 0 && (
          <div className='absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded'>
            Cover Photo
          </div>
        )}
        {imageItem.type === 'file' && (
          <div className='absolute top-2 right-2 bg-amber-600 text-white text-xs px-2 py-1 rounded'>
            New
          </div>
        )}
      </div>

      <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
        <button
          type='button'
          {...attributes}
          {...listeners}
          disabled={disabled}
          className='p-2 bg-slate-700 rounded-lg hover:bg-slate-600 cursor-grab active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50'
        >
          <GripVertical className='h-5 w-5 text-white' />
        </button>
        <button
          type='button'
          onClick={() => onRemove(id)}
          disabled={disabled}
          className='p-2 bg-red-600 rounded-lg hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50'
        >
          <X className='h-5 w-5 text-white' />
        </button>
      </div>
    </div>
  );
}

const RestaurantImagesUpload = ({
  imageItems,
  onImageItemsChange,
  isSaving,
  maxImages = 5,
}: RestaurantImagesUploadProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Cleanup preview URLs when component unmounts or items change
  useEffect(() => {
    return () => {
      imageItems.forEach((item) => {
        if (item.type === 'file' && item.url.startsWith('blob:')) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, [imageItems]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const ids = imageItems.map((item) => item.id);
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over.id as string);

      const newItems = arrayMove(imageItems, oldIndex, newIndex);
      onImageItemsChange(newItems);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (imageItems.length >= maxImages) {
        alert(`Maximum ${maxImages} images allowed`);
        return;
      }

      // Create local preview URL
      const previewUrl = URL.createObjectURL(file);
      const newItem: ImageItem = {
        id: `file-${Date.now()}-${Math.random()}`,
        type: 'file',
        url: previewUrl,
        file,
      };

      onImageItemsChange([...imageItems, newItem]);
    }
    // Reset the input
    e.target.value = '';
  };

  const handleRemove = (id: string) => {
    if (imageItems.length <= 1) {
      alert('At least one image is required');
      return;
    }

    // Cleanup preview URL if it's a file
    const item = imageItems.find((item) => item.id === id);
    if (item && item.type === 'file' && item.url.startsWith('blob:')) {
      URL.revokeObjectURL(item.url);
    }

    onImageItemsChange(imageItems.filter((item) => item.id !== id));
  };

  const itemIds = imageItems.map((item) => item.id);

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold'>Restaurant Images</h3>
          <p className='text-sm text-muted-foreground'>
            Add up to {maxImages} images. First image will be the cover photo. Drag to reorder.
          </p>
          <p className='text-xs text-amber-600 mt-1'>
            Images marked as &quot;New&quot; will be uploaded when you save the form.
          </p>
        </div>
        <div className='text-sm text-muted-foreground'>
          {imageItems.length} / {maxImages}
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
            {imageItems.map((item, index) => (
              <SortableImageItem
                key={item.id}
                id={item.id}
                imageItem={item}
                index={index}
                onRemove={handleRemove}
                disabled={isSaving || false}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {imageItems.length < maxImages && (
        <div className='flex items-center justify-center'>
          <label className='cursor-pointer'>
            <input
              type='file'
              accept='image/*'
              className='hidden'
              onChange={handleFileChange}
              disabled={isSaving}
            />
            <div className='flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors'>
              <Upload className='h-4 w-4' />
              <span>Upload Image</span>
            </div>
          </label>
        </div>
      )}

      {imageItems.length === 0 && (
        <p className='text-sm text-red-500 text-center'>At least one image is required</p>
      )}
    </div>
  );
};

export default RestaurantImagesUpload;
