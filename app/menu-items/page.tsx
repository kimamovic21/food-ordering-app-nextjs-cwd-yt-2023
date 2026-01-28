'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import useProfile from '@/contexts/UseProfile';
import Title from '@/components/shared/Title';
import MenuItems from './MenuItems';
import SearchInput from './SearchInput';

interface MenuItem {
  _id: string;
  image?: string;
  name: string;
  description: string;
  category?: { _id: string; name: string } | string;
  priceSmall: number;
  priceMedium: number;
  priceLarge: number;
}

interface Category {
  _id: string;
  name: string;
}

const MenuItemsListPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, loading } = useProfile();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const query = searchParams!.get('q');
    if (query) {
      setSearchInput(query);
      setActiveSearch(query);
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      const [itemsRes, catsRes] = await Promise.all([
        fetch('/api/menu-items'),
        fetch('/api/categories'),
      ]);
      const items = await itemsRes.json();
      const cats = await catsRes.json();
      setMenuItems(items);
      setCategories(cats);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/menu-items/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/menu-items?_id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Delete failed');

      toast.success('Menu item deleted', {
        style: {
          background: '#22c55e',
          color: 'white',
        },
      });
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete menu item', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
    }
  };

  const handleSearch = () => {
    const trimmedSearch = searchInput.trim();
    setActiveSearch(trimmedSearch);

    if (trimmedSearch) {
      router.push(`/menu-items?q=${encodeURIComponent(trimmedSearch)}`);
    } else {
      router.push('/menu-items');
    }
  };

  const handleReset = () => {
    setSearchInput('');
    setActiveSearch('');
    router.push('/menu-items');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const filteredItems = useMemo(() => {
    if (!activeSearch) return menuItems;

    const searchLower = activeSearch.toLowerCase();
    return menuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower)
    );
  }, [menuItems, activeSearch]);

  const showSkeleton = loading || isLoading;

  if (!loading && data?.role !== 'admin' && data?.role !== 'manager')
    return 'Not an admin or manager.';

  return (
    <section className='mt-8'>
      {showSkeleton ? (
        <div className='space-y-10'>
          <div className='space-y-3'>
            <div className='h-4 w-40 md:w-48 bg-muted animate-pulse rounded-md' />
            <div className='flex items-center justify-between'>
              <div className='h-10 w-60 md:w-80 bg-muted animate-pulse rounded-md' />
              <div className='h-10 w-40 md:w-48 bg-muted animate-pulse rounded-md' />
            </div>
          </div>

          {[1, 2, 3].map((section) => (
            <div key={section} className='space-y-5'>
              <div className='h-7 w-64 md:w-80 bg-muted animate-pulse rounded-md' />
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {[1, 2, 3].map((card) => (
                  <div
                    key={card}
                    className='rounded-xl border border-border/50 bg-muted/30 overflow-hidden flex flex-col'
                  >
                    <div className='h-52 w-full bg-muted animate-pulse' />
                    <div className='p-4 space-y-3'>
                      <div className='h-5 w-4/5 bg-muted animate-pulse rounded-md' />
                      <div className='h-3 w-2/5 bg-muted animate-pulse rounded-md' />
                      <div className='space-y-2'>
                        <div className='h-3 w-full bg-muted animate-pulse rounded-md' />
                        <div className='h-3 w-11/12 bg-muted animate-pulse rounded-md' />
                      </div>
                      <div className='flex gap-2 text-xs'>
                        <div className='h-3 w-16 bg-muted animate-pulse rounded-md' />
                        <div className='h-3 w-16 bg-muted animate-pulse rounded-md' />
                        <div className='h-3 w-16 bg-muted animate-pulse rounded-md' />
                      </div>
                      <div className='flex gap-2 pt-2'>
                        <div className='h-9 w-full bg-muted animate-pulse rounded-md' />
                        <div className='h-9 w-full bg-muted animate-pulse rounded-md' />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className='flex items-center justify-between mb-6'>
            <Title>Menu Items</Title>
            {data?.role === 'admin' && (
              <Button onClick={() => router.push('/menu-items/new')}>Create New Item</Button>
            )}
          </div>

          {/* Search Section */}
          <div className='mb-8 max-w-2xl'>
            <div className='flex gap-2 items-center'>
              <div className='flex-1'>
                <SearchInput
                  value={searchInput}
                  onChange={setSearchInput}
                  onSearch={handleSearch}
                  onClear={() => setSearchInput('')}
                  onKeyPress={handleKeyPress}
                />
              </div>
              {activeSearch && (
                <Button
                  onClick={handleReset}
                  variant='outline'
                  className='gap-2 h-11 px-6'
                  type='button'
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Search Results Section */}
          {activeSearch && (
            <div className='mb-10'>
              <div className='bg-muted/50 rounded-lg p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h2 className='text-2xl font-semibold'>
                    Search Results for &quot;{activeSearch}&quot;
                  </h2>
                  <span className='text-sm text-muted-foreground'>
                    {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
                  </span>
                </div>

                {filteredItems.length > 0 ? (
                  <MenuItems
                    menuItems={filteredItems}
                    categories={categories}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isAdmin={data?.role === 'admin'}
                  />
                ) : (
                  <div className='text-center py-8'>
                    <p className='text-muted-foreground'>
                      No menu items found matching your search.
                    </p>
                    <Button onClick={handleReset} variant='outline' className='mt-4'>
                      View All Menu Items
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Menu Items Section - Only show when not searching */}
          {!activeSearch && (
            <MenuItems
              menuItems={menuItems}
              categories={categories}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isAdmin={data?.role === 'admin'}
            />
          )}
        </>
      )}
    </section>
  );
};

export default MenuItemsListPage;
