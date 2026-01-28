'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MenuItem from './MenuItem';
import SearchInput from './SearchInput';

interface MenuItemType {
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

const MenuPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<MenuItemType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const [itemsResponse, categoriesResponse] = await Promise.all([
          fetch('/api/menu-items'),
          fetch('/api/categories'),
        ]);

        const itemsData = await itemsResponse.json();
        const categoriesData = await categoriesResponse.json();

        setItems(Array.isArray(itemsData) ? itemsData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setItems([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const query = searchParams!.get('q');
    if (query) {
      setSearchInput(query);
      setActiveSearch(query);
    }
  }, [searchParams]);

  const getCategoryId = (item: MenuItemType) => {
    if (typeof item.category === 'string') return item.category;
    return item.category?._id || '';
  };

  const handleSearch = () => {
    const trimmedSearch = searchInput.trim();
    setActiveSearch(trimmedSearch);

    if (trimmedSearch) {
      router.push(`/menu?q=${encodeURIComponent(trimmedSearch)}`);
    } else {
      router.push('/menu');
    }
  };

  const handleReset = () => {
    setSearchInput('');
    setActiveSearch('');
    router.push('/menu');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const filteredItems = useMemo(() => {
    if (!activeSearch) return items;

    const searchLower = activeSearch.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower)
    );
  }, [items, activeSearch]);

  const groupedItems = useMemo(() => {
    return categories.map((category) => ({
      label: category.name,
      items: items.filter((item) => getCategoryId(item) === category._id),
    }));
  }, [items, categories]);

  return (
    <main className='max-w-6xl mx-auto px-4 py-12'>
      {loading ? (
        <>
          <header className='mb-10 text-center'>
            <Skeleton className='h-10 w-32 mx-auto mb-3' />
            <Skeleton className='h-6 w-64 mx-auto' />
          </header>

          <div className='space-y-10'>
            {[1, 2, 3].map((index) => (
              <section key={index}>
                <Skeleton className='h-8 w-24 mb-4' />

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {[...Array(3)].map((_, index) => (
                    <Card key={index} className='p-0 overflow-hidden flex flex-col'>
                      <div className='relative h-40 p-4 bg-muted'>
                        <Skeleton className='mx-auto h-32 w-32 rounded-full' />
                      </div>

                      <div className='p-4 flex flex-col flex-1'>
                        <Skeleton className='h-7 w-3/4 mb-4' />

                        <div className='space-y-2 flex-1'>
                          <Skeleton className='h-4 w-full' />
                          <Skeleton className='h-4 w-full' />
                          <Skeleton className='h-4 w-5/6' />
                        </div>

                        <div className='flex gap-1 justify-center mt-4'>
                          <Skeleton className='h-9 w-20' />
                          <Skeleton className='h-9 w-20' />
                          <Skeleton className='h-9 w-20' />
                        </div>

                        <Skeleton className='h-12 w-full mt-4' />
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      ) : (
        <>
          <header className='mb-10 text-center'>
            <h1 className='text-4xl font-bold mb-3'>Menu</h1>
            <p className='text-muted-foreground'>Browse your favorite food and drinks.</p>
          </header>

          {/* Search Section */}
          <div className='mb-8 max-w-2xl mx-auto'>
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
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {filteredItems.map((item) => (
                      <MenuItem key={item._id} item={item} />
                    ))}
                  </div>
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

          {/* Categories Section - Only show when not searching */}
          {!activeSearch && (
            <div className='space-y-10'>
              {groupedItems.map(({ label, items }) => {
                if (items.length === 0) return null;

                return (
                  <section key={label}>
                    <h2 className='text-2xl font-semibold mb-4 capitalize'>{label}</h2>

                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                      {items.map((item) => (
                        <MenuItem key={item._id} item={item} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default MenuPage;
