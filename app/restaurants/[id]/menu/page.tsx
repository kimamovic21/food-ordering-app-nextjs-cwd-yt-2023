'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Link from 'next/link';
import MenuItem from './MenuItem';
import SearchInput from './SearchInput';
import MenuPageSkeleton from './MenuPageSkeleton';

interface MenuItemType {
  _id: string;
  image?: string;
  name: string;
  description: string;
  category?: { _id: string; name: string } | string;
  priceSmall: number | null;
  priceMedium: number | null;
  priceLarge: number | null;
  restaurantId: string;
  restaurantAverageRating?: number;
  restaurantRatingCount?: number;
}

interface Category {
  _id: string;
  name: string;
}

interface CategorySummary {
  _id: string;
  name: string;
  items: MenuItemType[];
  total: number;
}

type SortOption = 'price_asc' | 'price_desc' | 'newest' | 'oldest';

const DEFAULT_SORT: SortOption = 'newest';

const toCategorySlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const isObjectId = (value: string) => /^[a-f0-9]{24}$/i.test(value);

const RestaurantMenuPage = () => {
  const params = useParams();
  const id = params?.id as string;

  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isResultsLoading, setIsResultsLoading] = useState(false);
  const [results, setResults] = useState<MenuItemType[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const [pendingSelectedCategories, setPendingSelectedCategories] = useState<string[]>([]);
  const [pendingSortBy, setPendingSortBy] = useState<SortOption>(DEFAULT_SORT);
  const [pendingMinPrice, setPendingMinPrice] = useState('');
  const [pendingMaxPrice, setPendingMaxPrice] = useState('');

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>(DEFAULT_SORT);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const pageSize = 10;

  const categoryNameBySlug = useMemo(() => {
    const entries = categories.map((category) => [toCategorySlug(category.name), category.name]);
    return Object.fromEntries(entries);
  }, [categories]);

  const isResultsView =
    activeSearch.length > 0 ||
    selectedCategories.length > 0 ||
    minPrice.length > 0 ||
    maxPrice.length > 0 ||
    sortBy !== DEFAULT_SORT;

  const filterKey = useMemo(
    () =>
      JSON.stringify({
        activeSearch,
        selectedCategories: [...selectedCategories].sort(),
        minPrice,
        maxPrice,
        sortBy,
      }),
    [activeSearch, selectedCategories, minPrice, maxPrice, sortBy]
  );
  const lastFilterKeyRef = useRef(filterKey);

  const updateQueryParams = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      if (!id) return;

      const paramsState = new URLSearchParams(searchParams?.toString() || '');

      Object.entries(updates).forEach(([key, value]) => {
        if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
          paramsState.delete(key);
          return;
        }

        paramsState.set(key, Array.isArray(value) ? value.join(',') : value);
      });

      const queryString = paramsState.toString();
      const basePath = `/restaurants/${id}/menu`;
      router.replace(queryString ? `${basePath}?${queryString}` : basePath, { scroll: false });
    },
    [id, searchParams, router]
  );

  useEffect(() => {
    if (!id) return;

    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/restaurants/${id}/menu?groupBy=category&perCategory=1`);
        const data = await response.json();
        const summaries = Array.isArray(data?.categories) ? data.categories : [];
        setCategories(
          summaries.map((summary: CategorySummary) => ({ _id: summary._id, name: summary.name }))
        );
      } catch (error) {
        console.error('Error fetching restaurant categories:', error);
        setCategories([]);
      }
    };

    fetchCategories();
  }, [id]);

  useEffect(() => {
    const query = searchParams?.get('q') || '';
    const categoriesParam = searchParams?.get('categories') || '';
    const sortParam = (searchParams?.get('sort') || DEFAULT_SORT) as SortOption;
    const minPriceParam = searchParams?.get('minPrice') || '';
    const maxPriceParam = searchParams?.get('maxPrice') || '';
    const pageParam = Number(searchParams?.get('page') || '1');

    const rawCategories = categoriesParam
      ? categoriesParam
          .split(',')
          .filter(Boolean)
          .map((value) => value.trim())
      : [];

    const resolvedCategories = rawCategories.map((value) => {
      if (isObjectId(value)) {
        const match = categories.find((category) => category._id === value);
        return match ? toCategorySlug(match.name) : value;
      }

      return toCategorySlug(value);
    });

    const uniqueCategories = Array.from(new Set(resolvedCategories));

    setSearchInput(query);
    setActiveSearch(query);
    setSelectedCategories(uniqueCategories);
    setPendingSelectedCategories(uniqueCategories);
    setSortBy(
      ['price_asc', 'price_desc', 'newest', 'oldest'].includes(sortParam) ? sortParam : DEFAULT_SORT
    );
    setPendingSortBy(
      ['price_asc', 'price_desc', 'newest', 'oldest'].includes(sortParam) ? sortParam : DEFAULT_SORT
    );
    setMinPrice(minPriceParam);
    setPendingMinPrice(minPriceParam);
    setMaxPrice(maxPriceParam);
    setPendingMaxPrice(maxPriceParam);
    setPage(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1);

    if (rawCategories.some(isObjectId) && categories.length > 0) {
      updateQueryParams({ categories: resolvedCategories });
    }
  }, [searchParams, categories, updateQueryParams]);

  useEffect(() => {
    if (!isResultsView) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    if (lastFilterKeyRef.current !== filterKey) {
      setResults([]);
      setTotalResults(0);
      lastFilterKeyRef.current = filterKey;
    }
  }, [filterKey, isResultsView]);

  useEffect(() => {
    if (!id || isResultsView) return;

    const fetchSummary = async () => {
      setIsSummaryLoading(true);
      try {
        const response = await fetch(`/api/restaurants/${id}/menu?groupBy=category&perCategory=3`);
        const data = await response.json();
        setCategorySummaries(Array.isArray(data?.categories) ? data.categories : []);
      } catch (error) {
        console.error('Error fetching restaurant menu summaries:', error);
        setCategorySummaries([]);
      } finally {
        setIsSummaryLoading(false);
        setIsInitialLoading(false);
      }
    };

    fetchSummary();
  }, [id, isResultsView]);

  useEffect(() => {
    if (!id || !isResultsView) return;

    const controller = new AbortController();

    const fetchResults = async () => {
      setIsResultsLoading(true);

      try {
        const paramsState = new URLSearchParams();
        paramsState.set('limit', String(pageSize));
        paramsState.set('page', String(page));
        paramsState.set('sort', sortBy);

        if (activeSearch) paramsState.set('q', activeSearch);
        if (selectedCategories.length > 0) {
          paramsState.set('categories', selectedCategories.join(','));
        }
        if (minPrice) paramsState.set('minPrice', minPrice);
        if (maxPrice) paramsState.set('maxPrice', maxPrice);

        const response = await fetch(`/api/restaurants/${id}/menu?${paramsState.toString()}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        const items = Array.isArray(data?.items) ? data.items : [];
        const total = typeof data?.total === 'number' ? data.total : 0;

        setTotalResults(total);
        setResults((prev) => (page === 1 ? items : [...prev, ...items]));
      } catch (error) {
        if (!(error instanceof DOMException)) {
          console.error('Error fetching restaurant menu results:', error);
        }
      } finally {
        setIsResultsLoading(false);
        setIsInitialLoading(false);
      }
    };

    fetchResults();

    return () => controller.abort();
  }, [id, isResultsView, activeSearch, selectedCategories, minPrice, maxPrice, sortBy, page]);

  const handleSearch = () => {
    const trimmedSearch = searchInput.trim();
    setActiveSearch(trimmedSearch);
    setPage(1);
    updateQueryParams({ q: trimmedSearch || null, page: '1' });
  };

  const handleResetSearch = () => {
    setSearchInput('');
    setActiveSearch('');
    setPage(1);
    updateQueryParams({ q: null, page: '1' });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleApplyFilters = () => {
    setSelectedCategories(pendingSelectedCategories);
    setSortBy(pendingSortBy);
    setMinPrice(pendingMinPrice);
    setMaxPrice(pendingMaxPrice);
    setPage(1);
    updateQueryParams({
      categories: pendingSelectedCategories.length > 0 ? pendingSelectedCategories : null,
      sort: pendingSortBy === DEFAULT_SORT ? null : pendingSortBy,
      minPrice: pendingMinPrice || null,
      maxPrice: pendingMaxPrice || null,
      page: '1',
    });
  };

  const handleSortChange = (value: SortOption) => {
    setPendingSortBy(value);
  };

  const toggleCategory = (categorySlug: string) => {
    const nextSelected = pendingSelectedCategories.includes(categorySlug)
      ? pendingSelectedCategories.filter((slug) => slug !== categorySlug)
      : [...new Set([...pendingSelectedCategories, categorySlug])];

    setPendingSelectedCategories(nextSelected);
  };

  const handleClearFilters = () => {
    setPendingSelectedCategories([]);
    setPendingSortBy(DEFAULT_SORT);
    setPendingMinPrice('');
    setPendingMaxPrice('');
    setSelectedCategories([]);
    setSortBy(DEFAULT_SORT);
    setMinPrice('');
    setMaxPrice('');
    setPage(1);
    updateQueryParams({
      categories: null,
      sort: null,
      minPrice: null,
      maxPrice: null,
      page: '1',
    });
  };

  const handleClearAll = () => {
    setSearchInput('');
    setActiveSearch('');
    setPendingSelectedCategories([]);
    setPendingSortBy(DEFAULT_SORT);
    setPendingMinPrice('');
    setPendingMaxPrice('');
    setSelectedCategories([]);
    setSortBy(DEFAULT_SORT);
    setMinPrice('');
    setMaxPrice('');
    setPage(1);
    updateQueryParams({
      q: null,
      categories: null,
      sort: null,
      minPrice: null,
      maxPrice: null,
      page: '1',
    });
  };

  const handleViewMoreCategory = (categorySlug: string) => {
    setPendingSelectedCategories([categorySlug]);
    setSelectedCategories([categorySlug]);
    setPage(1);
    updateQueryParams({ categories: [categorySlug], page: '1' });
  };

  const handleLoadMore = () => {
    if (results.length >= totalResults) return;
    const nextPage = page + 1;
    setPage(nextPage);
    updateQueryParams({ page: String(nextPage) });
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    minPrice.length > 0 ||
    maxPrice.length > 0 ||
    sortBy !== DEFAULT_SORT;

  const shouldShowSkeleton =
    isInitialLoading ||
    (isSummaryLoading && categorySummaries.length === 0) ||
    (isResultsLoading && results.length === 0);

  useEffect(() => {
    if (id) {
      setIsInitialLoading(true);
    }
  }, [id]);

  return (
    <main className='max-w-7xl mx-auto px-4 py-12'>
      {shouldShowSkeleton ? (
        <div className='mb-4 flex items-center gap-2'>
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-4 w-4' />
          <Skeleton className='h-4 w-28' />
          <Skeleton className='h-4 w-4' />
          <Skeleton className='h-4 w-24' />
        </div>
      ) : (
        <Breadcrumb className='mb-4'>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href='/restaurants'>Restaurants</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/restaurants/${id}`}>Restaurant details</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Restaurant menu</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {shouldShowSkeleton ? (
        <MenuPageSkeleton sectionCount={1} cardsPerSection={3} />
      ) : (
        <>
          <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start'>
            <div className='space-y-10'>
              <div className='space-y-6'>
                <header className='space-y-3'>
                  <h1 className='text-4xl font-bold'>Restaurant Menu</h1>
                  <p className='text-muted-foreground'>
                    Browse food and drinks available in this restaurant.
                  </p>
                </header>

                <div className='flex flex-col sm:flex-row gap-3 sm:items-center'>
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
                      onClick={handleResetSearch}
                      variant='outline'
                      className='h-11 px-5'
                      type='button'
                    >
                      Reset search
                    </Button>
                  )}
                </div>

                {(activeSearch || hasActiveFilters) && (
                  <div className='flex flex-wrap items-center gap-2 text-sm'>
                    {activeSearch && <Badge variant='secondary'>Search: {activeSearch}</Badge>}
                    {selectedCategories.map((categorySlug) => (
                      <Badge key={categorySlug} variant='secondary'>
                        {categoryNameBySlug[categorySlug] || categorySlug}
                      </Badge>
                    ))}
                    {minPrice && <Badge variant='secondary'>Min ${minPrice}</Badge>}
                    {maxPrice && <Badge variant='secondary'>Max ${maxPrice}</Badge>}
                    {sortBy !== DEFAULT_SORT && (
                      <Badge variant='secondary'>
                        Sort:{' '}
                        {sortBy === 'price_asc'
                          ? 'Low to high'
                          : sortBy === 'price_desc'
                            ? 'High to low'
                            : sortBy === 'oldest'
                              ? 'Oldest added'
                              : 'Newest added'}
                      </Badge>
                    )}
                    <Button variant='ghost' className='h-8 px-2' onClick={handleClearAll}>
                      Clear all
                    </Button>
                  </div>
                )}
              </div>

              <div className='space-y-10'>
                {isResultsView ? (
                  <section className='space-y-6'>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
                      <h2 className='text-2xl font-semibold'>Menu results</h2>
                      <span className='text-sm text-muted-foreground'>
                        {totalResults} {totalResults === 1 ? 'item' : 'items'} found
                      </span>
                    </div>

                    {results.length > 0 ? (
                      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {results.map((item) => (
                          <MenuItem key={item._id} item={item} />
                        ))}
                      </div>
                    ) : (
                      <div className='text-center py-10'>
                        <p className='text-muted-foreground'>No menu items match these filters.</p>
                        <Button onClick={handleClearAll} variant='outline' className='mt-4'>
                          Clear all filters
                        </Button>
                      </div>
                    )}

                    {results.length > 0 && results.length < totalResults && (
                      <div className='flex justify-center'>
                        <Button
                          onClick={handleLoadMore}
                          disabled={isResultsLoading}
                          className='px-8'
                        >
                          {isResultsLoading ? 'Loading...' : 'View more'}
                        </Button>
                      </div>
                    )}
                  </section>
                ) : (
                  <div className='space-y-10'>
                    {categorySummaries.map((summary) => {
                      if (summary.items.length === 0) return null;

                      return (
                        <section key={summary._id}>
                          <div className='flex items-center justify-between mb-4'>
                            <h2 className='text-2xl font-semibold capitalize'>{summary.name}</h2>
                            <span className='text-sm text-muted-foreground'>
                              {summary.total} items
                            </span>
                          </div>

                          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                            {summary.items.map((item) => (
                              <MenuItem key={item._id} item={item} />
                            ))}
                          </div>

                          {summary.total > summary.items.length && (
                            <div className='mt-4 flex justify-end'>
                              <Button
                                onClick={() => handleViewMoreCategory(toCategorySlug(summary.name))}
                              >
                                View more
                              </Button>
                            </div>
                          )}
                        </section>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <Card className='w-full p-5 space-y-5'>
              <div className='space-y-2'>
                <p className='text-sm font-semibold'>Sort by</p>
                <Select
                  value={pendingSortBy}
                  onValueChange={(value) => handleSortChange(value as SortOption)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Sort menu items' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='newest'>Newest added</SelectItem>
                    <SelectItem value='oldest'>Oldest added</SelectItem>
                    <SelectItem value='price_asc'>Low price to high</SelectItem>
                    <SelectItem value='price_desc'>High price to low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-3'>
                <p className='text-sm font-semibold'>Filter by category</p>
                <div className='grid grid-cols-1 gap-2'>
                  {categories.map((category) => {
                    const categorySlug = toCategorySlug(category.name);

                    return (
                      <label
                        key={category._id}
                        className='flex items-center gap-2 text-sm leading-none'
                      >
                        <Checkbox
                          className='h-4 w-4 shrink-0 p-0 flex-none'
                          checked={pendingSelectedCategories.includes(categorySlug)}
                          onCheckedChange={() => toggleCategory(categorySlug)}
                        />
                        <span className='min-w-0 capitalize'>{category.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className='space-y-3'>
                <p className='text-sm font-semibold'>Price range</p>
                <div className='grid grid-cols-2 gap-3'>
                  <div className='space-y-1'>
                    <span className='text-xs text-muted-foreground'>Min price</span>
                    <Input
                      type='number'
                      min='0'
                      value={pendingMinPrice}
                      onChange={(event) => {
                        setPendingMinPrice(event.target.value);
                      }}
                      placeholder='10'
                    />
                  </div>
                  <div className='space-y-1'>
                    <span className='text-xs text-muted-foreground'>Max price</span>
                    <Input
                      type='number'
                      min='0'
                      value={pendingMaxPrice}
                      onChange={(event) => {
                        setPendingMaxPrice(event.target.value);
                      }}
                      placeholder='50'
                    />
                  </div>
                </div>
              </div>

              <div className='space-y-2'>
                <Button className='w-full' onClick={handleApplyFilters}>
                  Apply filters
                </Button>

                <Button variant='outline' className='w-full' onClick={handleClearFilters}>
                  Reset filters
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}
    </main>
  );
};

export default RestaurantMenuPage;
