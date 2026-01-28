'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useRouter, useParams } from 'next/navigation';
import { Form } from '@/components/ui/form';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import useProfile from '@/contexts/UseProfile';
import Title from '@/components/shared/Title';
import MenuItemImage from '../../MenuItemImage';
import MenuItemForm from '../../MenuItemForm';

interface Category {
  _id: string;
  name: string;
}

const EditMenuItemPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = (params as any)!.id as string;
  const form = useForm();
  const { data, loading } = useProfile();

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [priceSmall, setPriceSmall] = useState('');
  const [priceMedium, setPriceMedium] = useState('');
  const [priceLarge, setPriceLarge] = useState('');
  const [image, setImage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    fetchCategoriesAndItem();
  }, [id]);

  const fetchCategoriesAndItem = async () => {
    try {
      const [catsRes, itemRes] = await Promise.all([
        fetch('/api/categories'),
        fetch(`/api/menu-items?_id=${id}`),
      ]);

      const cats = await catsRes.json();
      setCategories(cats);

      const items = await itemRes.json();
      if (items.length > 0) {
        const item = items[0];
        setName(item.name);
        setDescription(item.description);
        setCategoryId(typeof item.category === 'string' ? item.category : item.category?._id || '');
        setPriceSmall(item.priceSmall.toString());
        setPriceMedium(item.priceMedium.toString());
        setPriceLarge(item.priceLarge.toString());
        setImage(item.image || '');
        setImagePreview(item.image || '');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load menu item');
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length !== 1) return;

    const file = files[0];
    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const data = new FormData();
    data.append('file', file);
    data.append('menuItemId', id);

    const res = await fetch('/api/upload/menu-items', {
      method: 'POST',
      body: data,
    });

    if (!res.ok) {
      throw new Error('Upload failed');
    }

    const json = await res.json();
    return json.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      name.trim() === '' ||
      categoryId.trim() === '' ||
      priceSmall.trim() === '' ||
      priceMedium.trim() === '' ||
      priceLarge.trim() === ''
    ) {
      toast.error('Name, category, and all prices are required', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
      return;
    }

    setIsSaving(true);

    try {
      const s = Number(priceSmall);
      const m = Number(priceMedium);
      const l = Number(priceLarge);

      if (isNaN(s) || isNaN(m) || isNaN(l)) {
        toast.error('All prices must be valid numbers', {
          style: {
            background: '#ef4444',
            color: 'white',
          },
        });
        setIsSaving(false);
        return;
      }

      let imageUrl = image;
      if (imageFile) {
        imageUrl = (await toast.promise(uploadImage(imageFile), {
          loading: 'Uploading image...',
          success: 'Image uploaded!',
          error: 'Image upload failed',
        })) as string;
      }

      const menuItemData = {
        name,
        description,
        category: categoryId,
        priceSmall: s,
        priceMedium: m,
        priceLarge: l,
        image: imageUrl || '',
      };

      const response = await fetch('/api/menu-items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: id, ...menuItemData }),
      });

      if (!response.ok) throw new Error('Failed to update menu item');

      toast.success('Menu item updated!', {
        style: {
          background: '#22c55e',
          color: 'white',
        },
      });
      router.push('/menu-items');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update menu item', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  const showSkeleton = loading || isDataLoading;

  if (!loading && data?.role !== 'admin') return 'Not an admin.';

  return (
    <section className='mt-8 pb-10'>
      {showSkeleton ? (
        <div className='space-y-6 max-w-3xl mx-auto'>
          <div className='space-y-3'>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <div className='h-4 w-24 bg-muted animate-pulse rounded-md' />
              <div className='h-4 w-3 bg-muted animate-pulse rounded-md' />
              <div className='h-4 w-24 bg-muted animate-pulse rounded-md' />
            </div>
            <div className='h-10 w-64 bg-muted animate-pulse rounded-md' />
          </div>

          <div className='flex flex-col md:flex-row items-start gap-6'>
            <div className='flex flex-col items-center gap-3 w-full md:w-1/2'>
              <div className='w-full aspect-square min-h-64 md:min-h-72 bg-muted animate-pulse rounded-xl' />
              <div className='h-9 w-18 bg-muted animate-pulse rounded-md' />
            </div>

            <div className='w-full space-y-4'>
              <div className='space-y-2'>
                <div className='h-4 w-56 bg-muted animate-pulse rounded-md' />
                <div className='h-10 w-full bg-muted animate-pulse rounded-md' />
              </div>
              <div className='space-y-2'>
                <div className='h-4 w-48 bg-muted animate-pulse rounded-md' />
                <div className='h-10 w-full bg-muted animate-pulse rounded-md' />
              </div>
              <div className='space-y-2'>
                <div className='h-4 w-52 bg-muted animate-pulse rounded-md' />
                <div className='h-32 w-full bg-muted animate-pulse rounded-md' />
              </div>
              <div className='space-y-2'>
                <div className='h-4 w-52 bg-muted animate-pulse rounded-md' />
                <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className='space-y-2'>
                      <div className='h-3 w-28 bg-muted animate-pulse rounded-md' />
                      <div className='h-10 w-full bg-muted animate-pulse rounded-md' />
                    </div>
                  ))}
                </div>
              </div>
              <div className='h-11 w-full bg-muted animate-pulse rounded-md' />
            </div>
          </div>
        </div>
      ) : (
        <>
          <Breadcrumb className='mb-4'>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href='/menu-items'>Menu Items</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>Edit menu item</BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Title>Edit Menu Item</Title>

          <Form {...form}>
            <form className='mt-8 max-w-2xl lg:max-w-3xl mx-auto' onSubmit={handleSubmit}>
              <div className='flex flex-col md:flex-row items-start gap-6'>
                <MenuItemImage
                  imagePreview={imagePreview}
                  image={image}
                  onImageSelect={handleImageSelect}
                  disabled={isSaving}
                />

                <MenuItemForm
                  name={name}
                  categoryId={categoryId}
                  categories={categories}
                  description={description}
                  priceSmall={priceSmall}
                  priceMedium={priceMedium}
                  priceLarge={priceLarge}
                  editingItem={id}
                  isSaving={isSaving}
                  onNameChange={setName}
                  onCategoryChange={setCategoryId}
                  onDescriptionChange={setDescription}
                  onPriceSmallChange={setPriceSmall}
                  onPriceMediumChange={setPriceMedium}
                  onPriceLargeChange={setPriceLarge}
                  onCancel={() => router.push('/menu-items')}
                />
              </div>
            </form>
          </Form>
        </>
      )}
    </section>
  );
};

export default EditMenuItemPage;
