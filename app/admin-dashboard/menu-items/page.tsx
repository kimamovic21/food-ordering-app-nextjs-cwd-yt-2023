'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
import useProfile from '@/hooks/useProfile';
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
  isAvailable?: boolean;
}

interface Category {
  _id: string;
  name: string;
}

const MENU_ITEMS_SCROLL_STATE_KEY = 'admin-dashboard-menu-items-scroll-state';

const getAdminDashboardScrollContainer = () => {
  if (typeof document === 'undefined') return null;

  return document.querySelector<HTMLElement>('[data-admin-dashboard-scroll-container="true"]');
};

const MenuItemsListPage = () => {
  const router = useRouter();
  const { data, loading } = useProfile();
  const hasRestoredScrollRef = useRef(false);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Immediately clear data when user changes
  useEffect(() => {
    if (data?._id !== currentUserId) {
      setMenuItems([]);
      setCategories([]);
      setSearchInput('');
      setActiveSearch('');
      setIsLoading(true);
      setCurrentUserId(data?._id || null);
    }
  }, [data?._id, currentUserId]);

  const fetchData = useCallback(async () => {
    const startTime = Date.now();

    try {
      // If user is admin, fetch only their menu items
      const url =
        data?.role === 'admin' && data?._id
          ? `/api/menu-items?adminId=${data._id}`
          : '/api/menu-items';

      const [itemsRes, catsRes] = await Promise.all([fetch(url), fetch('/api/categories')]);
      const items = await itemsRes.json();
      const cats = await catsRes.json();

      // Calculate remaining time to reach 500ms minimum
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, 500 - elapsed);

      // Wait for the remaining time to ensure 500ms minimum delay
      await new Promise((resolve) => setTimeout(resolve, remainingTime));

      setMenuItems(items);
      setCategories(cats);
    } catch (error) {
      console.error('Error fetching data:', error);
      sonnerToast.error('Failed to load data', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, [data?.role, data?._id]);

  useEffect(() => {
    if (data?._id) {
      fetchData();
    }
  }, [fetchData, data?._id]);

  const handleEdit = (id: string) => {
    try {
      const scrollContainer = getAdminDashboardScrollContainer();

      sessionStorage.setItem(
        MENU_ITEMS_SCROLL_STATE_KEY,
        JSON.stringify({
          top: scrollContainer?.scrollTop ?? window.scrollY,
          savedAt: Date.now(),
        })
      );
    } catch {
      // Navigation should still work if browser storage is unavailable.
    }

    router.push(`/admin-dashboard/menu-items/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/menu-items?_id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Delete failed');

      sonnerToast.success('Menu item deleted', {
        style: {
          background: '#22c55e',
          color: 'white',
        },
      });
      fetchData();
    } catch (err) {
      console.error(err);
      sonnerToast.error('Failed to delete menu item', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
    }
  };

  const handleToggleAvailability = async (id: string, isAvailable: boolean) => {
    const previousItems = menuItems;

    setMenuItems((items) =>
      items.map((item) => (item._id === id ? { ...item, isAvailable } : item))
    );

    try {
      const res = await fetch('/api/menu-items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: id, isAvailable }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || 'Failed to update availability');
      }

      sonnerToast.success(isAvailable ? 'Menu item is available' : 'Menu item marked unavailable', {
        style: {
          background: '#22c55e',
          color: 'white',
        },
      });
    } catch (err) {
      console.error(err);
      setMenuItems(previousItems);
      sonnerToast.error(err instanceof Error ? err.message : 'Failed to update availability', {
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
      router.push(`/admin-dashboard/menu-items?q=${encodeURIComponent(trimmedSearch)}`);
    } else {
      router.push('/admin-dashboard/menu-items');
    }
  };

  const handleReset = () => {
    setSearchInput('');
    setActiveSearch('');
    router.push('/admin-dashboard/menu-items');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const filteredItems = useMemo(() => {
    // Don't return any items if we're loading or user is changing
    if (isLoading || data?._id !== currentUserId) return [];

    if (!activeSearch) return menuItems;

    const searchLower = activeSearch.toLowerCase();
    return menuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower)
    );
  }, [menuItems, activeSearch, isLoading, data?._id, currentUserId]);

  // Show skeleton when loading OR when user has changed but data hasn't loaded yet
  const showSkeleton = loading || isLoading || data?._id !== currentUserId;

  useEffect(() => {
    if (showSkeleton || hasRestoredScrollRef.current) {
      return;
    }

    const savedScrollState = sessionStorage.getItem(MENU_ITEMS_SCROLL_STATE_KEY);
    if (!savedScrollState) {
      return;
    }

    hasRestoredScrollRef.current = true;

    try {
      const { top, savedAt } = JSON.parse(savedScrollState) as {
        top?: number;
        savedAt?: number;
      };

      sessionStorage.removeItem(MENU_ITEMS_SCROLL_STATE_KEY);

      if (typeof top !== 'number' || Number.isNaN(top)) {
        return;
      }

      const isFresh = typeof savedAt === 'number' && Date.now() - savedAt < 30 * 60 * 1000;
      if (!isFresh) {
        return;
      }

      requestAnimationFrame(() => {
        const scrollContainer = getAdminDashboardScrollContainer();

        if (scrollContainer) {
          scrollContainer.scrollTop = top;
          return;
        }

        window.scrollTo({ top });
      });
    } catch {
      sessionStorage.removeItem(MENU_ITEMS_SCROLL_STATE_KEY);
    }
  }, [showSkeleton]);

  if (!loading && data?.role !== 'admin') return 'Not an admin.';

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
              <Button onClick={() => router.push('/admin-dashboard/menu-items/new')}>
                Create New Item
              </Button>
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
                    onToggleAvailability={handleToggleAvailability}
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
              onToggleAvailability={handleToggleAvailability}
              isAdmin={data?.role === 'admin'}
            />
          )}
        </>
      )}
    </section>
  );
};

export default MenuItemsListPage;
