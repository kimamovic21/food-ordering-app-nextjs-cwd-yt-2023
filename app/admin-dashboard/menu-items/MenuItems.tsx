'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';

import {
  createDataTableColumnHelper,
  TanStackDataTable,
  type DataTableColumnDef,
} from '@/components/shared/TanStackDataTable';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface MenuItem {
  _id: string;
  image?: string;
  name: string;
  description: string;
  category?: { _id: string; name: string } | string;
  priceType?: string;
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
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleAvailability: (id: string, isAvailable: boolean) => void;
  isAdmin?: boolean;
}

type MenuItemRow = MenuItem & {
  categoryName: string;
};

const columnHelper = createDataTableColumnHelper<MenuItemRow>();
const DESCRIPTION_PREVIEW_LENGTH = 82;

const getCategoryId = (item: MenuItem): string => {
  if (typeof item.category === 'string') return item.category;
  return item.category?._id || '';
};

const getCategoryName = (item: MenuItem, categories: Category[]) => {
  if (typeof item.category === 'object' && item.category?.name) {
    return item.category.name;
  }

  const categoryId = getCategoryId(item);
  return categories.find((category) => category._id === categoryId)?.name || categoryId || 'Other';
};

const formatPrice = (price: number | null) => {
  if (typeof price !== 'number' || !Number.isFinite(price)) {
    return '-';
  }

  return `$${price.toFixed(2)}`;
};

const getDescriptionPreview = (description: string) => {
  const normalizedDescription = description.trim();

  if (normalizedDescription.length <= DESCRIPTION_PREVIEW_LENGTH) {
    return {
      isTruncated: false,
      text: normalizedDescription,
    };
  }

  return {
    isTruncated: true,
    text: `${normalizedDescription.slice(0, DESCRIPTION_PREVIEW_LENGTH).trimEnd()}...`,
  };
};

const getLowestPrice = (item: MenuItemRow) => {
  const prices = [item.priceSmall, item.priceMedium, item.priceLarge].filter(
    (price): price is number => typeof price === 'number' && Number.isFinite(price)
  );

  return prices.length > 0 ? Math.min(...prices) : Number.MAX_SAFE_INTEGER;
};

const getEffectivePriceType = (item: MenuItemRow) => {
  if (item.priceType === 'single' || item.priceType === 'double' || item.priceType === 'triple') {
    return item.priceType;
  }

  if (item.priceLarge != null) {
    return 'triple';
  }

  if (item.priceMedium != null) {
    return 'double';
  }

  return 'single';
};

const getPriceRows = (item: MenuItemRow) => {
  const priceType = getEffectivePriceType(item);

  if (priceType === 'single') {
    return [{ label: 'Price', value: item.priceSmall }];
  }

  if (priceType === 'double') {
    return [
      { label: 'Small', value: item.priceSmall },
      { label: 'Large', value: item.priceMedium ?? item.priceLarge },
    ];
  }

  return [
    { label: 'Small', value: item.priceSmall },
    { label: 'Medium', value: item.priceMedium },
    { label: 'Large', value: item.priceLarge },
  ];
};

function AvailabilityBadge({ isAvailable }: { isAvailable: boolean }) {
  return (
    <Badge
      variant={isAvailable ? 'outline' : 'destructive'}
      className={
        isAvailable
          ? 'border-transparent bg-green-600 text-white hover:bg-green-700 dark:bg-green-600'
          : 'bg-red-600 text-white hover:bg-red-600 dark:bg-red-500'
      }
    >
      {isAvailable ? 'Available' : 'Unavailable'}
    </Badge>
  );
}

function ItemImage({ item }: { item: MenuItemRow }) {
  const isAvailable = item.isAvailable !== false;
  const hasRemoteImage = typeof item.image === 'string' && item.image.trim().startsWith('http');

  return (
    <div className='relative h-16 w-20 overflow-hidden rounded-md border border-white/10 bg-muted'>
      {hasRemoteImage ? (
        <Image
          src={item.image!}
          alt={item.name}
          fill
          sizes='80px'
          className='object-cover'
          onError={() => {
            console.warn(`Failed to load image: ${item.image}`);
          }}
        />
      ) : (
        <div className='flex h-full items-center justify-center px-2 text-center text-[11px] text-muted-foreground'>
          No image
        </div>
      )}
      {!isAvailable ? (
        <div className='absolute inset-0 flex items-center justify-center bg-black/65 text-[10px] font-semibold uppercase tracking-wide text-white'>
          Off
        </div>
      ) : null}
    </div>
  );
}

function PricesCell({ item }: { item: MenuItemRow }) {
  const prices = getPriceRows(item);

  return (
    <div className='grid w-40 gap-1.5'>
      {prices.map((price) => (
        <div
          key={price.label}
          className='flex items-center justify-between gap-3 rounded-md border border-white/10 bg-background/70 px-3 py-1.5 text-sm'
        >
          <span className='text-xs font-semibold text-muted-foreground'>{price.label}</span>
          <span className='font-bold text-primary'>{formatPrice(price.value)}</span>
        </div>
      ))}
    </div>
  );
}

function DescriptionPreview({ item }: { item: MenuItemRow }) {
  if (!item.description.trim()) {
    return <p className='text-sm text-muted-foreground'>No description yet.</p>;
  }

  const descriptionPreview = getDescriptionPreview(item.description);

  return (
    <p className='max-w-[34ch] whitespace-normal break-words text-sm leading-relaxed text-muted-foreground'>
      {descriptionPreview.text}
      {descriptionPreview.isTruncated ? (
        <>
          {' '}
          <Link
            href={`/menu/${item._id}`}
            className='inline-block whitespace-nowrap font-semibold text-primary underline-offset-4 transition hover:underline'
            aria-label={`See more about ${item.name}`}
          >
            See more
          </Link>
        </>
      ) : null}
    </p>
  );
}

function AvailabilityCell({
  item,
  isAdmin,
  onToggleAvailability,
}: {
  item: MenuItemRow;
  isAdmin: boolean;
  onToggleAvailability: (id: string, isAvailable: boolean) => void;
}) {
  const isAvailable = item.isAvailable !== false;

  return (
    <div className='space-y-2'>
      <AvailabilityBadge isAvailable={isAvailable} />
      {isAdmin ? (
        <label className='flex w-fit cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-muted/30 px-3 py-2 text-xs text-muted-foreground transition hover:bg-muted/50'>
          <Checkbox
            checked={isAvailable}
            onCheckedChange={(checked) => onToggleAvailability(item._id, checked === true)}
            className='h-4 w-4 shrink-0'
          />
          <span className='font-medium'>Accept orders</span>
        </label>
      ) : null}
    </div>
  );
}

function MenuItemActions({
  item,
  onEdit,
  onDelete,
}: {
  item: MenuItemRow;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleConfirmDelete = () => {
    onDelete(item._id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <div className='flex items-center gap-2'>
        <Button
          type='button'
          variant='outline'
          size='icon'
          className='size-9 rounded-full'
          onClick={() => onEdit(item._id)}
          aria-label={`Edit ${item.name}`}
        >
          <Pencil className='size-4' aria-hidden='true' />
        </Button>
        <Button
          type='button'
          variant='outline'
          size='icon'
          className='size-9 rounded-full border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400'
          onClick={() => setIsDeleteDialogOpen(true)}
          aria-label={`Delete ${item.name}`}
        >
          <Trash2 className='size-4' aria-hidden='true' />
        </Button>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete menu item?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {item.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className='bg-red-600 text-white hover:bg-red-700'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const menuItemColumnLabels = {
  actions: 'Actions',
  availability: 'Availability',
  category: 'Category',
  image: 'Image',
  item: 'Item',
  prices: 'Prices',
};

const MenuItems = ({
  menuItems,
  categories,
  searchQuery,
  onSearchChange,
  onEdit,
  onDelete,
  onToggleAvailability,
  isAdmin = true,
}: MenuItemsProps) => {
  const rows = useMemo(
    () =>
      menuItems.map((item) => ({
        ...item,
        categoryName: getCategoryName(item, categories),
      })),
    [categories, menuItems]
  );

  const availableCount = rows.filter((item) => item.isAvailable !== false).length;
  const unavailableCount = rows.length - availableCount;

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: 'image',
          header: 'Image',
          cell: ({ row }) => <ItemImage item={row.original} />,
          enableGlobalFilter: false,
          enableSorting: false,
        }),
        columnHelper.accessor((item) => `${item.name} ${item.categoryName} ${item.description}`, {
          id: 'item',
          header: 'Item',
          cell: ({ row }) => (
            <div className='min-w-0 max-w-[360px] space-y-1 whitespace-normal'>
              <div className='flex flex-wrap items-center gap-2'>
                <span className='font-semibold leading-tight'>{row.original.name}</span>
                <Badge variant='secondary' className='capitalize'>
                  {row.original.categoryName}
                </Badge>
              </div>
              <DescriptionPreview item={row.original} />
            </div>
          ),
        }),
        columnHelper.accessor((item) => item.categoryName, {
          id: 'category',
          header: 'Category',
          cell: ({ getValue }) => (
            <span className='capitalize text-muted-foreground'>{getValue()}</span>
          ),
        }),
        columnHelper.accessor((item) => getLowestPrice(item), {
          id: 'prices',
          header: 'Prices',
          sortDescFirst: false,
          cell: ({ row }) => <PricesCell item={row.original} />,
        }),
        columnHelper.accessor(
          (item) => (item.isAvailable !== false ? 'Available' : 'Unavailable'),
          {
            id: 'availability',
            header: 'Availability',
            cell: ({ row }) => (
              <AvailabilityCell
                item={row.original}
                isAdmin={isAdmin}
                onToggleAvailability={onToggleAvailability}
              />
            ),
          }
        ),
        columnHelper.display({
          id: 'actions',
          header: 'Actions',
          cell: ({ row }) => (
            <MenuItemActions item={row.original} onEdit={onEdit} onDelete={onDelete} />
          ),
          enableGlobalFilter: false,
          enableHiding: false,
          enableSorting: false,
        }),
      ]) satisfies DataTableColumnDef<MenuItemRow>[],
    [isAdmin, onDelete, onEdit, onToggleAvailability]
  );

  return (
    <div className='mt-8'>
      <TanStackDataTable
        columns={columns}
        data={rows}
        tableKey='admin-menu-items'
        searchPlaceholder='Search menu items by name, category, description, or status...'
        emptyMessage='No menu items found. Create your first one.'
        globalFilter={searchQuery}
        onGlobalFilterChange={onSearchChange}
        initialPageSize={10}
        initialSorting={[{ id: 'item', desc: false }]}
        minWidthClassName='min-w-[940px]'
        columnLabels={menuItemColumnLabels}
        toolbarContent={
          <div className='flex flex-wrap items-center gap-2'>
            <Badge className='bg-green-600 text-white hover:bg-green-700'>
              {availableCount} available
            </Badge>
            <Badge variant='destructive'>{unavailableCount} unavailable</Badge>
          </div>
        }
        getRowClassName={(row) => (row.isAvailable === false ? 'bg-red-500/[0.04]' : '')}
        getHeaderClassName={(columnId) =>
          columnId === 'image'
            ? 'w-24'
            : columnId === 'item'
              ? 'w-[360px] max-w-[360px] whitespace-normal'
              : columnId === 'category'
                ? 'w-28'
                : columnId === 'prices'
                  ? 'w-44'
                  : columnId === 'availability'
                    ? 'w-36'
                    : columnId === 'actions'
                      ? 'sticky right-0 z-20 w-24 bg-card/95 text-right backdrop-blur'
                      : ''
        }
        getCellClassName={(columnId) =>
          columnId === 'image'
            ? 'w-24'
            : columnId === 'item'
              ? 'w-[360px] max-w-[360px] whitespace-normal'
              : columnId === 'category'
                ? 'w-28'
                : columnId === 'prices'
                  ? 'w-44'
                  : columnId === 'availability'
                    ? 'w-36'
                    : columnId === 'actions'
                      ? 'sticky right-0 z-10 w-24 bg-card/95 shadow-[-18px_0_24px_-26px_rgba(0,0,0,0.9)] backdrop-blur'
                      : ''
        }
      />
    </div>
  );
};

export default MenuItems;
