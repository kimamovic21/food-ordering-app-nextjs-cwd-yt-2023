'use client';

import { useEffect, useState } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import toast from 'react-hot-toast';
import useProfile from '@/contexts/UseProfile';
import Title from '@/components/shared/Title';

type CategoryType = {
  _id: string;
  name: string;
};

const CategoriesPage = () => {
  const [categoryName, setCategoryName] = useState('');
  const [categories, setCategories] = useState<Array<CategoryType>>([]);
  const [editingCategory, setEditingCategory] = useState<CategoryType | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: profileData, loading: profileLoading } = useProfile();

  const fetchCategories = () => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((categories) => {
        setCategories(categories);
      });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const creationPromise = new Promise(async (resolve, reject) => {
      const data: Partial<CategoryType> = { name: categoryName };

      if (editingCategory) {
        data._id = editingCategory._id;
      }

      const response = await fetch('/api/categories', {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      setCategoryName('');
      fetchCategories();
      setEditingCategory(null);

      if (response.ok) resolve(true);
      else reject(false);
    });

    toast.promise(creationPromise, {
      loading: editingCategory ? 'Updating your category...' : 'Creating your new category...',
      success: editingCategory ? 'Category updated!' : 'Category created!',
      error: editingCategory ? 'Failed to update category.' : 'Failed to create category.',
    });
  };

  const handleDeleteCategory = (categoryId: string) => {
    const deletePromise = new Promise(async (resolve, reject) => {
      const response = await fetch('/api/categories', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ _id: categoryId }),
      });

      setDeletingId(null);
      fetchCategories();

      if (response.ok) resolve(true);
      else reject(false);
    });

    toast.promise(deletePromise, {
      loading: 'Deleting category and associated menu items...',
      success: 'Category and associated menu items deleted successfully!',
      error: 'Failed to delete category.',
    });
  };

  if (profileLoading) {
    return 'Loading...';
  }

  if (!profileData || !profileData.admin) {
    return 'Not an admin';
  }

  return (
    <section className='mt-8 w-full px-4 max-w-4xl mx-auto'>
      <Title>Categories</Title>

      <div className='mt-8 bg-card rounded-lg border border-border p-6'>
        <form onSubmit={handleCategorySubmit}>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='category-name' className='text-base'>
                {editingCategory ? 'Update category' : 'New category name'}
              </Label>
              {editingCategory && (
                <p className='text-sm font-semibold text-muted-foreground'>
                  Current: {editingCategory.name}
                </p>
              )}
              <Input
                id='category-name'
                type='text'
                placeholder='Enter category name'
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                required
                className='bg-background'
              />
            </div>

            <div className='flex gap-2'>
              <Button type='submit' className='bg-orange-500 hover:bg-orange-600'>
                {editingCategory ? 'Update' : 'Create'}
              </Button>
              {editingCategory && (
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryName('');
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>

      <div className='mt-8'>
        <Title className='mb-4'>Existing categories</Title>

        {categories.length === 0 && <p className='text-muted-foreground'>No categories yet.</p>}

        {categories.length > 0 && (
          <div className='space-y-3'>
            <p className='text-sm text-muted-foreground mb-4'>
              Click the pencil icon to edit, or the trash icon to delete a category
            </p>
            {categories.map((category) => (
              <div
                key={category._id}
                className='flex items-center justify-between bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors gap-3'
              >
                <span className='flex-1 font-medium text-foreground'>{category.name}</span>

                <div className='flex items-center gap-2 shrink-0'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='text-primary hover:text-primary hover:bg-primary/10'
                    onClick={() => {
                      setEditingCategory(category);
                      setCategoryName(category.name);
                    }}
                    title='Edit category'
                  >
                    <Pencil className='w-4 h-4' />
                  </Button>

                  <AlertDialog
                    open={deletingId === category._id}
                    onOpenChange={(open) => {
                      if (!open) setDeletingId(null);
                    }}
                  >
                    <AlertDialogTrigger asChild>
                      <button
                        type='button'
                        className='text-destructive hover:text-destructive hover:bg-destructive/10 p-2 rounded-md transition-colors'
                        onClick={() => setDeletingId(category._id)}
                        title='Delete category'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className='bg-card'>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category</AlertDialogTitle>
                        <AlertDialogDescription className='text-foreground/80'>
                          Are you sure you want to delete this category? All menu items with this
                          category will also be deleted. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className='bg-destructive/10 border border-destructive/20 rounded p-3 text-sm text-destructive'>
                        Category: <span className='font-semibold'>{category.name}</span>
                      </div>
                      <div className='flex gap-3 justify-end'>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteCategory(category._id)}
                          className='bg-destructive hover:bg-destructive/90'
                        >
                          Delete
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoriesPage;
