'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Image from 'next/image';

interface MenuItem {
  _id: string;
  image?: string;
  name: string;
  description: string;
  category?: { _id: string; name: string } | string;
  priceSmall: number | null;
  priceMedium: number | null;
  priceLarge: number | null;
  isAvailable?: boolean;
}

interface Category {
  _id: string;
  name: string;
}

interface MenuItemsProps {
  menuItems: MenuItem[];
  categories: Category[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleAvailability: (id: string, isAvailable: boolean) => void;
  isAdmin?: boolean;
}

const getCategoryId = (item: MenuItem): string => {
  if (typeof item.category === 'string') return item.category;
  return item.category?._id || '';
};

const AdminItemCard = ({
  item,
  onEdit,
  onDelete,
  onToggleAvailability,
  isAdmin = true,
}: {
  item: MenuItem;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleAvailability: (id: string, isAvailable: boolean) => void;
  isAdmin?: boolean;
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const isAvailable = item.isAvailable !== false;

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    onDelete(item._id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <Card className='hover:shadow-lg transition-shadow overflow-hidden flex flex-col h-full'>
        <div className='relative w-full h-48 bg-muted overflow-hidden'>
          {item.image && typeof item.image === 'string' && item.image.startsWith('http') ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              className='object-cover hover:scale-105 transition-transform'
              onError={() => {
                console.warn(`Failed to load image: ${item.image}`);
              }}
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center text-muted-foreground text-sm'>
              No image
            </div>
          )}
          {!isAvailable && (
            <div className='absolute inset-0 flex items-center justify-center bg-black/65 text-white'>
              <span className='rounded-full border border-white/40 bg-black/40 px-4 py-2 text-sm font-semibold'>
                Unavailable
              </span>
            </div>
          )}
        </div>

        <CardContent className='flex flex-col grow pt-4'>
          <div className='flex items-start justify-between gap-3'>
            <h3 className='font-semibold text-lg leading-tight'>{item.name}</h3>
            <Badge
              variant={isAvailable ? 'outline' : 'destructive'}
              className={
                isAvailable
                  ? 'border-transparent bg-green-600 text-white hover:bg-green-700 dark:bg-green-600'
                  : undefined
              }
            >
              {isAvailable ? 'Available' : 'Unavailable'}
            </Badge>
          </div>
          {item.category && (
            <p className='text-xs text-muted-foreground mt-1'>
              {typeof item.category === 'string' ? item.category : item.category?.name}
            </p>
          )}
          {item.description && (
            <p className='text-muted-foreground/80 text-sm mt-2 line-clamp-2'>{item.description}</p>
          )}

          {(() => {
            const prices = [
              { label: 'S', value: item.priceSmall },
              { label: 'M', value: item.priceMedium },
              { label: 'L', value: item.priceLarge },
            ].filter((p) => typeof p.value === 'number' && Number.isFinite(p.value));

            if (prices.length === 0) {
              return <p className='text-destructive text-xs mt-2'>Prices missing</p>;
            }

            return (
              <div className='mt-4 flex flex-wrap gap-2.5'>
                {prices.map((price) => (
                  <span
                    key={price.label}
                    className='inline-flex items-baseline gap-1 rounded-md border bg-primary/10 px-3 py-2 text-base shadow-sm'
                  >
                    <span className='text-sm font-semibold text-muted-foreground'>
                      {price.label}:
                    </span>
                    <span className='font-bold text-primary'>${price.value!.toFixed(2)}</span>
                  </span>
                ))}
              </div>
            );
          })()}
        </CardContent>

        <CardFooter className='flex gap-2 pt-2'>
          {isAdmin && (
            <div className='w-full space-y-3'>
              <label className='flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm'>
                <Checkbox
                  checked={isAvailable}
                  onCheckedChange={(checked) => onToggleAvailability(item._id, checked === true)}
                  className='h-4 w-4 shrink-0'
                />
                <span className='font-medium'>Available for ordering</span>
              </label>
              <div className='flex gap-2'>
                <Button
                  className='flex-1'
                  variant='outline'
                  size='sm'
                  onClick={() => onEdit(item._id)}
                >
                  Edit
                </Button>
                <Button
                  className='flex-1 hover:bg-red-700'
                  size='sm'
                  onClick={handleDeleteClick}
                  style={{ backgroundColor: '#dc2626', color: 'white' }}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const MenuItems = ({
  menuItems,
  categories,
  onEdit,
  onDelete,
  onToggleAvailability,
  isAdmin = true,
}: MenuItemsProps) => {
  if (menuItems.length === 0) {
    return (
      <div className='mt-12'>
        <p className='text-gray-500 text-center py-8'>No menu items yet. Create your first one!</p>
      </div>
    );
  }

  return (
    <div className='mt-12'>
      <div className='space-y-12'>
        {categories.map((category) => {
          const items = menuItems.filter((mi) => getCategoryId(mi) === category._id);
          if (items.length === 0) return null;

          return (
            <section key={category._id}>
              <h3 className='text-2xl font-semibold mb-6 capitalize'>{category.name}</h3>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {items.map((item) => (
                  <AdminItemCard
                    key={item._id}
                    item={item}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleAvailability={onToggleAvailability}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default MenuItems;
