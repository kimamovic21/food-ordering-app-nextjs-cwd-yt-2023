'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import UserTabs from '@/components/shared/UserTabs';
import useProfile from '@/contexts/UseProfile';
import MenuItemForm from './MenuItemForm';
import MenuItemImage from './MenuItemImage';
import MenuItems from './MenuItems';

interface MenuItem {
  _id: string;
  image?: string;
  name: string;
  description: string;
  basePrice: number;
}

const MenuItemsPage = () => {
  const { data, loading } = useProfile();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [image, setImage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const res = await fetch('/api/menu-items');
      const items = await res.json();
      setMenuItems(items);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items');
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

  const uploadImage = async (file: File, menuItemId?: string): Promise<string> => {
    const data = new FormData();
    data.append('file', file);

    if (menuItemId) {
      data.append('menuItemId', menuItemId);
    }

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

    if (!name || !basePrice) {
      toast.error('Name and price are required');
      return;
    }

    setIsSaving(true);

    try {
      let imageUrl = image;

      if (imageFile) {
        imageUrl = await toast.promise(
          uploadImage(imageFile, editingItem || undefined),
          {
            loading: 'Uploading image...',
            success: 'Image uploaded!',
            error: 'Image upload failed.',
          }
        );
      }

      const menuItemData = {
        name,
        description,
        basePrice: parseFloat(basePrice),
        image: imageUrl || '',
      };

      if (editingItem) {
        const response = await fetch('/api/menu-items', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ _id: editingItem, ...menuItemData }),
        });

        if (!response.ok) {
          throw new Error('Failed to update');
        }

        toast.success('Menu item updated!');
      } else {
        const response = await fetch('/api/menu-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(menuItemData),
        });

        if (!response.ok) {
          throw new Error('Failed to create');
        }

        toast.success('Menu item created!');
      }

      setName('');
      setDescription('');
      setBasePrice('');
      setImage('');
      setImageFile(null);
      setImagePreview('');
      setEditingItem(null);
      fetchMenuItems();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error(`Failed to ${editingItem ? 'update' : 'create'} menu item`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item._id);
    setName(item.name);
    setDescription(item.description);
    setBasePrice(item.basePrice.toString());
    setImage(item.image || '');
    setImagePreview(item.image || '');
    setImageFile(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const response = await fetch(`/api/menu-items?_id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      toast.success('Menu item deleted!');
      fetchMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error('Failed to delete menu item.');
    }
  };

  const handleCancel = () => {
    setEditingItem(null);
    setName('');
    setDescription('');
    setBasePrice('');
    setImage('');
    setImageFile(null);
    setImagePreview('');
  };

  if (loading) {
    return 'Loading user info';
  }

  if (!data?.admin) {
    return 'Not an admin.';
  }

  return (
    <section className='mt-8'>
      <UserTabs isAdmin={true} />

      <form className='mt-8 max-w-md mx-auto' onSubmit={handleSubmit}>
        <div className='flex items-start gap-6'>
          <MenuItemImage
            imagePreview={imagePreview}
            image={image}
            onImageSelect={handleImageSelect}
            disabled={isSaving}
          />

          <MenuItemForm
            name={name}
            description={description}
            basePrice={basePrice}
            editingItem={editingItem}
            isSaving={isSaving}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            onBasePriceChange={setBasePrice}
            onCancel={handleCancel}
          />
        </div>
      </form>

      <MenuItems
        menuItems={menuItems}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </section>
  );
};

export default MenuItemsPage;