'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import Image from 'next/image';
import Link from 'next/link';
import Title from '@/components/shared/Title';
import SearchInput from './SearchInput';

interface RestaurantListItem {
  _id: string;
  name: string;
  city: string;
  country: string;
  street: string;
  description: string;
  image: string | null;
  isOpen: boolean;
}

const PAGE_SIZE = 9;

const RestaurantsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [restaurants, setRestaurants] = useState<RestaurantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const queryKey = useMemo(() => JSON.stringify({ page, activeSearch }), [page, activeSearch]);

  useEffect(() => {
    const query = (searchParams?.get('q') || '').trim();
    const pageParam = Number(searchParams?.get('page') || '1');

    setSearchInput(query);
    setActiveSearch(query);
    setPage(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1);
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('limit', String(PAGE_SIZE));
        params.set('page', String(page));

        if (activeSearch) {
          params.set('q', activeSearch);
        }

        const response = await fetch(`/api/restaurants?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch restaurants');
        }

        setRestaurants(Array.isArray(data.restaurants) ? data.restaurants : []);
        setTotalPages(Math.max(1, Number(data?.pagination?.totalPages || 1)));
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Error fetching restaurants:', error);
          setRestaurants([]);
          setTotalPages(1);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();

    return () => {
      controller.abort();
    };
  }, [queryKey, page, activeSearch]);

  const updateQueryParams = (nextPage: number, nextQuery: string) => {
    const params = new URLSearchParams();

    if (nextQuery.trim()) {
      params.set('q', nextQuery.trim());
    }

    if (nextPage > 1) {
      params.set('page', String(nextPage));
    }

    const queryString = params.toString();
    router.push(queryString ? `/restaurants?${queryString}` : '/restaurants');
  };

  const handleSearch = () => {
    const nextQuery = searchInput.trim();
    setActiveSearch(nextQuery);
    setPage(1);
    updateQueryParams(1, nextQuery);
  };

  const handleClear = () => {
    setSearchInput('');
    setActiveSearch('');
    setPage(1);
    updateQueryParams(1, '');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const goToPage = (nextPage: number) => {
    const validPage = Math.max(1, Math.min(totalPages, nextPage));
    setPage(validPage);
    updateQueryParams(validPage, activeSearch);
  };

  return (
    <section className='mt-8 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10'>
      {loading ? (
        <>
          {/* Loading - Title and Description Skeletons */}
          <div className='mb-6 flex flex-col gap-3'>
            <Skeleton className='h-12 w-full max-w-md rounded-lg' />
            <Skeleton className='h-5 w-full rounded-lg' />
          </div>

          {/* Loading - Search Input Skeleton */}
          <div className='mb-8'>
            <Skeleton className='h-11 w-full rounded-md' />
          </div>

          {/* Loading - Restaurant Cards Grid */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <div
                key={index}
                className='rounded-xl border border-border bg-card overflow-hidden p-0'
              >
                <Skeleton className='h-40 w-full rounded-none' />
                <div className='p-3 space-y-2'>
                  <div className='flex items-start justify-between gap-2'>
                    <Skeleton className='h-5 grow' />
                    <Skeleton className='h-6 w-12' />
                  </div>
                  <Skeleton className='h-4 w-3/4' />
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-full' />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Loaded - Title and Description */}
          <div className='mb-6 flex flex-col gap-3'>
            <Title>Restaurants</Title>
            <p className='text-sm text-muted-foreground'>
              Browse restaurants, discover their details, and choose where you want to order from.
            </p>
          </div>

          {/* Loaded - Search Input */}
          <div className='mb-8'>
            <SearchInput
              value={searchInput}
              onChange={setSearchInput}
              onSearch={handleSearch}
              onClear={handleClear}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Loaded - Restaurant Cards or No Results */}
          {restaurants.length === 0 ? (
            <Card>
              <CardContent className='py-10 text-center text-muted-foreground'>
                No restaurants found for your search.
              </CardContent>
            </Card>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
              {restaurants.map((restaurant) => (
                <Link href={`/restaurants/${restaurant._id}`} key={restaurant._id}>
                  <Card className='h-full overflow-hidden border-border/80 hover:shadow-md transition-shadow'>
                    <div className='relative h-48 w-full bg-muted'>
                      {restaurant.image ? (
                        <Image
                          src={restaurant.image}
                          alt={restaurant.name}
                          fill
                          className='object-cover'
                          sizes='(max-width: 1024px) 100vw, 33vw'
                        />
                      ) : (
                        <div className='h-full w-full flex items-center justify-center text-muted-foreground text-sm'>
                          No image available
                        </div>
                      )}
                    </div>
                    <CardHeader className='space-y-2'>
                      <div className='flex items-start justify-between gap-3'>
                        <CardTitle className='text-xl'>{restaurant.name}</CardTitle>
                        <Badge variant={restaurant.isOpen ? 'default' : 'secondary'}>
                          {restaurant.isOpen ? 'Open' : 'Closed'}
                        </Badge>
                      </div>
                      <p className='text-sm text-muted-foreground flex items-center gap-1'>
                        <MapPin className='h-4 w-4' />
                        {restaurant.city}, {restaurant.country}
                      </p>
                    </CardHeader>
                    <CardContent className='space-y-2'>
                      <p className='text-sm text-muted-foreground'>{restaurant.street}</p>
                      <p className='text-sm text-foreground/90'>
                        {restaurant.description.length > 110
                          ? `${restaurant.description.slice(0, 110)}...`
                          : restaurant.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {restaurants.length > 0 && (
            <div className='mt-8 flex items-center justify-center'>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={`/restaurants?page=${Math.max(1, page - 1)}${
                        activeSearch ? `&q=${encodeURIComponent(activeSearch)}` : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        goToPage(page - 1);
                      }}
                      aria-disabled={page <= 1}
                      className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>

                  <div className='px-4 text-sm text-muted-foreground'>
                    Page {page} of {totalPages}
                  </div>

                  <PaginationItem>
                    <PaginationNext
                      href={`/restaurants?page=${Math.min(totalPages, page + 1)}${
                        activeSearch ? `&q=${encodeURIComponent(activeSearch)}` : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        goToPage(page + 1);
                      }}
                      aria-disabled={page >= totalPages}
                      className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default RestaurantsPage;
