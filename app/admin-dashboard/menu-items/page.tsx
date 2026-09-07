'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseAsString, useQueryState } from 'nuqs';
import { Button } from '@/components/ui/button';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
import useProfile from '@/hooks/useProfile';
import Title from '@/components/shared/Title';
import MenuItems from './MenuItems';
import type { MenuItemCategory, MenuItemListItem } from '@/types/menu';

const MENU_ITEMS_SCROLL_STATE_KEY = 'admin-dashboard-menu-items-scroll-state';

const getAdminDashboardScrollContainer = () => {
  if (typeof document === 'undefined') return null;

  return document.querySelector<HTMLElement>('[data-admin-dashboard-scroll-container="true"]');
};

const MenuItemsListPage = () => {
  const router = useRouter();
  const { data, loading } = useProfile();
  const hasRestoredScrollRef = useRef(false);

  const [menuItems, setMenuItems] = useState<MenuItemListItem[]>([]);
  const [categories, setCategories] = useState<MenuItemCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useQueryState('q', parseAsString.withDefault(''));
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Immediately clear data when user changes
  useEffect(() => {
    if (data?._id !== currentUserId) {
      setMenuItems([]);
      setCategories([]);
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

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Delete failed');

      sonnerToast.success('Menu item deleted', {
        style: {
          background: '#22c55e',
          color: 'white',
        },
      });
      fetchData();
    } catch (err) {
      console.error(err);
      sonnerToast.error(err instanceof Error ? err.message : 'Failed to delete menu item', {
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

  const handleTableSearchChange = useCallback(
    (value: string) => {
      void setSearchQuery(value.trim() ? value : null);
    },
    [setSearchQuery]
  );

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

          <div className='overflow-hidden rounded-xl border border-white/10 bg-card/70'>
            <div className='flex flex-col gap-3 border-b border-white/10 p-4 md:flex-row md:items-center md:justify-between'>
              <div className='h-11 w-full max-w-md animate-pulse rounded-full bg-muted' />
              <div className='flex gap-2'>
                <div className='h-9 w-28 animate-pulse rounded-full bg-muted' />
                <div className='h-9 w-28 animate-pulse rounded-full bg-muted' />
                <div className='h-10 w-28 animate-pulse rounded-full bg-muted' />
              </div>
            </div>
            <div className='min-w-[940px] divide-y divide-white/10'>
              <div className='grid grid-cols-[96px_360px_110px_176px_140px_90px] gap-4 px-4 py-4'>
                {[1, 2, 3, 4, 5, 6].map((cell) => (
                  <div key={cell} className='h-4 animate-pulse rounded-md bg-muted' />
                ))}
              </div>
              {[1, 2, 3, 4, 5].map((row) => (
                <div
                  key={row}
                  className='grid grid-cols-[96px_360px_110px_176px_140px_90px] items-center gap-4 px-4 py-5'
                >
                  <div className='h-16 w-20 animate-pulse rounded-md bg-muted' />
                  <div className='space-y-3'>
                    <div className='h-5 w-48 animate-pulse rounded-md bg-muted' />
                    <div className='h-3 w-64 animate-pulse rounded-md bg-muted' />
                    <div className='h-3 w-44 animate-pulse rounded-md bg-muted' />
                  </div>
                  <div className='h-5 w-20 animate-pulse rounded-md bg-muted' />
                  <div className='space-y-2'>
                    <div className='h-7 w-36 animate-pulse rounded-md bg-muted' />
                    <div className='h-7 w-36 animate-pulse rounded-md bg-muted' />
                    <div className='h-7 w-36 animate-pulse rounded-md bg-muted' />
                  </div>
                  <div className='space-y-2'>
                    <div className='h-6 w-24 animate-pulse rounded-full bg-muted' />
                    <div className='h-4 w-36 animate-pulse rounded-md bg-muted' />
                  </div>
                  <div className='flex gap-2'>
                    <div className='size-9 animate-pulse rounded-full bg-muted' />
                    <div className='size-9 animate-pulse rounded-full bg-muted' />
                  </div>
                </div>
              ))}
            </div>
            <div className='flex items-center justify-between border-t border-white/10 p-4'>
              <div className='h-4 w-24 animate-pulse rounded-md bg-muted' />
              <div className='flex gap-2'>
                <div className='h-9 w-20 animate-pulse rounded-full bg-muted' />
                <div className='h-9 w-24 animate-pulse rounded-full bg-muted' />
              </div>
            </div>
          </div>
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

          <MenuItems
            menuItems={menuItems}
            categories={categories}
            searchQuery={searchQuery}
            onSearchChange={handleTableSearchChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleAvailability={handleToggleAvailability}
            isAdmin={data?.role === 'admin'}
          />
        </>
      )}
    </section>
  );
};

export default MenuItemsListPage;
