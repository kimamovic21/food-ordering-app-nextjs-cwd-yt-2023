'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import toast from 'react-hot-toast';
import { useRouter, useParams } from 'next/navigation';
import Title from '@/components/shared/Title';
import useProfile from '@/contexts/UseProfile';
import MenuItemImage from '../../MenuItemImage';
import MenuItemForm from '../../MenuItemForm';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface Category {
  _id: string;
  name: string;
}

const EditMenuItemPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
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
      toast.error('Name, category, and all prices are required');
      return;
    }

    setIsSaving(true);

    try {
      const s = Number(priceSmall);
      const m = Number(priceMedium);
      const l = Number(priceLarge);

      if (isNaN(s) || isNaN(m) || isNaN(l)) {
        toast.error('All prices must be valid numbers');
        setIsSaving(false);
        return;
      }

      let imageUrl = image;
      if (imageFile) {
        imageUrl = await toast.promise(uploadImage(imageFile), {
          loading: 'Uploading image...',
          success: 'Image uploaded!',
          error: 'Image upload failed',
        });
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

      toast.success('Menu item updated!');
      router.push('/menu-items');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update menu item');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return 'Loading user info...';
  if (!data?.admin) return 'Not an admin.';

  return (
    <section className='mt-8'>
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
    </section>
  );
};

export default EditMenuItemPage;
