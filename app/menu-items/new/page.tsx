'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Form } from '@/components/ui/form';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import Title from '@/components/shared/Title';
import useProfile from '@/contexts/UseProfile';
import MenuItemImage from '../MenuItemImage';
import MenuItemForm from '../MenuItemForm';

interface Category {
  _id: string;
  name: string;
}

const NewMenuItemPage = () => {
  const router = useRouter();
  const form = useForm();
  const { data, loading } = useProfile();

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [foodType, setFoodType] = useState('food');
  const [priceSmall, setPriceSmall] = useState('');
  const [priceMedium, setPriceMedium] = useState('');
  const [priceLarge, setPriceLarge] = useState('');
  const [image, setImage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const cats = await res.json();
      setCategories(cats);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setIsCategoriesLoading(false);
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

    const res = await fetch('/api/upload/menu-items', {
      method: 'POST',
      body: data,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Upload failed: ${res.status} - ${errorText}`);
    }

    const json = await res.json();
    if (!json.url || typeof json.url !== 'string' || !json.url.startsWith('http')) {
      console.error('Invalid upload response:', json);
      throw new Error(`Invalid image URL returned from upload: ${JSON.stringify(json)}`);
    }
    return json.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (name.trim() === '' || categoryId.trim() === '') {
      toast.error('Name and category are required', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
      return;
    }

    // Check if at least one price is provided
    const hasAnyPrice =
      foodType === 'drink'
        ? priceSmall.trim() !== ''
        : priceSmall.trim() !== '' || priceMedium.trim() !== '' || priceLarge.trim() !== '';
    if (!hasAnyPrice) {
      toast.error('At least one price is required', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
      return;
    }

    setIsSaving(true);

    try {
      const s = priceSmall.trim() ? Number(priceSmall) : null;
      const m = priceMedium.trim() ? Number(priceMedium) : null;
      const l = priceLarge.trim() ? Number(priceLarge) : null;

      // Validate that all prices (if provided) are valid numbers
      if (
        (priceSmall.trim() && isNaN(s as number)) ||
        (priceMedium.trim() && isNaN(m as number)) ||
        (priceLarge.trim() && isNaN(l as number))
      ) {
        toast.error('All prices must be valid numbers');
        setIsSaving(false);
        return;
      }

      let imageUrl = '';
      if (imageFile) {
        const uploadPromise = uploadImage(imageFile);
        toast.promise(uploadPromise, {
          loading: 'Uploading image...',
          success: 'Image uploaded!',
          error: 'Image upload failed',
        });
        imageUrl = await uploadPromise;
      }

      const menuItemData = {
        name,
        description,
        category: categoryId,
        foodType,
        priceSmall: s,
        priceMedium: foodType === 'drink' ? null : m,
        priceLarge: foodType === 'drink' ? null : l,
        image: imageUrl || '',
      };

      const response = await fetch('/api/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuItemData),
      });

      if (!response.ok) throw new Error('Failed to create menu item');

        toast.success('Menu item created!', {
          style: {
            background: '#22c55e',
            color: 'white',
          },
        });
      router.push('/menu-items');
    } catch (err) {
      console.error(err);
        toast.error('Failed to create menu item', {
          style: {
            background: '#ef4444',
            color: 'white',
          },
        });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategoryId('');
    setFoodType('food');
    setPriceSmall('');
    setPriceMedium('');
    setPriceLarge('');
    setImage('');
    setImageFile(null);
    setImagePreview('');
  };

  const handleFoodTypeChange = (value: string) => {
    setFoodType(value);
    if (value === 'drink') {
      setPriceMedium('');
      setPriceLarge('');
    }
  };

  const showSkeleton = loading || isCategoriesLoading;

  if (!loading && data?.role !== 'admin') return 'Not an admin.';

  if (!loading && data?.role === 'admin' && !data?.restaurantId) {
    return (
      <section className='mt-8 pb-10 max-w-3xl mx-auto'>
        <div className='bg-red-50 border border-red-200 rounded-lg p-6 text-center'>
          <h2 className='text-lg font-semibold text-red-800 mb-2'>No Restaurant</h2>
          <p className='text-red-700'>
            You need to have a restaurant created before you can add menu items. Please create or link a restaurant to your account first.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className='mt-8 pb-10'>
      {showSkeleton ? (
        <div className='space-y-6 max-w-3xl mx-auto'>
          <div className='space-y-3'>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <div className='h-4 w-24 bg-muted animate-pulse rounded-md' />
              <div className='h-4 w-3 bg-muted animate-pulse rounded-md' />
              <div className='h-4 w-20 bg-muted animate-pulse rounded-md' />
            </div>
            <div className='h-10 w-64 bg-muted animate-pulse rounded-md' />
          </div>

          <div className='flex flex-col md:flex-row items-start gap-6'>
            <div className='flex flex-col items-center gap-3 w-full md:w-1/2'>
              <div className='w-full aspect-square min-h-64 md:min-h-72 bg-muted animate-pulse rounded-xl' />
              <div className='h-9 w-20 bg-muted animate-pulse rounded-md' />
            </div>

            <div className='w-full space-y-4'>
              <div className='space-y-2'>
                <div className='h-4 w-40 bg-muted animate-pulse rounded-md' />
                <div className='h-10 w-full bg-muted animate-pulse rounded-md' />
              </div>
              <div className='space-y-2'>
                <div className='h-4 w-32 bg-muted animate-pulse rounded-md' />
                <div className='h-10 w-full bg-muted animate-pulse rounded-md' />
              </div>
              <div className='space-y-2'>
                <div className='h-4 w-36 bg-muted animate-pulse rounded-md' />
                <div className='h-32 w-full bg-muted animate-pulse rounded-md' />
              </div>
              <div className='space-y-2'>
                <div className='h-4 w-32 bg-muted animate-pulse rounded-md' />
                <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className='space-y-2'>
                      <div className='h-3 w-20 bg-muted animate-pulse rounded-md' />
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
              <BreadcrumbItem>New menu item</BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Title>Create New Menu Item</Title>

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
                  foodType={foodType}
                  priceSmall={priceSmall}
                  priceMedium={priceMedium}
                  priceLarge={priceLarge}
                  editingItem={null}
                  isSaving={isSaving}
                  onNameChange={setName}
                  onCategoryChange={setCategoryId}
                  onDescriptionChange={setDescription}
                  onFoodTypeChange={handleFoodTypeChange}
                  onPriceSmallChange={setPriceSmall}
                  onPriceMediumChange={setPriceMedium}
                  onPriceLargeChange={setPriceLarge}
                  onCancel={resetForm}
                />
              </div>
            </form>
          </Form>
        </>
      )}
    </section>
  );
};

export default NewMenuItemPage;
