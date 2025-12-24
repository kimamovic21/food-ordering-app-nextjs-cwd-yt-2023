'use client';

import { useEffect, useState } from 'react';
import Title from '@/components/shared/Title';
import useProfile from '@/contexts/UseProfile';
import toast from 'react-hot-toast';

type CategoryType = {
  _id: string;
  name: string;
};

const CategoriesPage = () => {
  const [categoryName, setCategoryName] = useState('');
  const [categories, setCategories] = useState<Array<CategoryType>>([]);
  const [editingCategory, setEditingCategory] = useState<CategoryType | null>(null);

  const {
    data: profileData,
    loading: profileLoading,
  } = useProfile();

  const fetchCategories = () => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(categories => {
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
      };

      const response = await fetch('/api/categories', {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      setCategoryName('');
      fetchCategories();
      setEditingCategory(null);

      if (response.ok) resolve(true);
      else reject(false);
    });

    toast.promise(creationPromise, {
      loading: editingCategory
        ? 'Updating your category...'
        : 'Creating your new category...',
      success: editingCategory
        ? 'Category updated!'
        : 'Category created!',
      error: editingCategory
        ? 'Failed to update category.'
        : 'Failed to create category.',
    });
  };

  if (profileLoading) {
    return 'Loading...';
  };

  if (!profileData || !profileData.admin) {
    return 'Not an admin';
  };

  return (
    <section className='mt-8 max-w-3xl mx-auto'>
      <Title>Categories</Title>

      <form className='mt-8' onSubmit={handleCategorySubmit}>
        <div className='flex gap-2 items-end'>
          <div className='grow'>
            <label>
              <span className='mr-1'>
                {editingCategory ? 'Update category:' : 'New category name:'}
              </span>
              {editingCategory && (
                <span className='font-semibold'>
                  {editingCategory.name}
                </span>
              )}
            </label>

            <input
              type='text'
              value={categoryName}
              onChange={e => setCategoryName(e.target.value)}
            />
          </div>

          <div className='pb-2'>
            <button
              className='border border-primary'
              type='submit'
            >
              {editingCategory ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </form>

      <div>
        <Title className='mt-8 mb-4'>Existing categories</Title>

        {categories.length === 0 && (
          <p>No categories yet.</p>
        )}

        {categories.length > 0 && (
          <>
            <h3 className='mt-8 text-sm text-gray-500'>
              edit category:
            </h3>
            {categories.map(category => (
              <button
                key={category.name}
                className='bg-gray-200 rounded-xl px-4 py-2 flex gap-1 cursor-pointer mb-2'
                onClick={() => {
                  setEditingCategory(category)
                  setCategoryName(category.name)
                }}
              >
                <span>{category.name}</span>
              </button>
            ))}
          </>
        )}
      </div>
    </section>
  );
};

export default CategoriesPage;