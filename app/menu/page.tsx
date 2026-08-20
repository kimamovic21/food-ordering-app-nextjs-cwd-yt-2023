'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import { Card } from '@/components/ui/card';
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
  isAvailable?: boolean;
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

const SORT_OPTIONS = ['price_asc', 'price_desc', 'newest', 'oldest'] as const;
type SortOption = (typeof SORT_OPTIONS)[number];
const DEFAULT_SORT: SortOption = 'newest';

const toCategorySlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const isObjectId = (value: string) => /^[a-f0-9]{24}$/i.test(value);

const preloadImage = (src: string) =>
  new Promise<void>((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    const image = new window.Image();
    let isSettled = false;

    const finish = () => {
      if (isSettled) {
        return;
      }

      isSettled = true;
      window.clearTimeout(timeout);
      resolve();
    };

    const timeout = window.setTimeout(finish, 2500);

    image.onload = finish;
    image.onerror = finish;
    image.src = src;

    if (image.complete) {
      finish();
    }
  });

const preloadMenuItemImages = async (items: MenuItemType[]) => {
  const imageUrls = Array.from(
    new Set(
      items
        .map((item) => item.image)
        .filter((image): image is string => Boolean(image && image.trim().length > 0))
    )
  );

  await Promise.all(imageUrls.map((imageUrl) => preloadImage(imageUrl)));
};

const MenuPage = () => {
  const [
    {
      q: searchQuery,
      categories: categoryQuery,
      sort: sortBy,
      minPrice: minPriceQuery,
      maxPrice: maxPriceQuery,
      page: pageQuery,
    },
    setMenuQuery,
  ] = useQueryStates({
    q: parseAsString.withDefault(''),
    categories: parseAsArrayOf(parseAsString, ',').withDefault([]),
    sort: parseAsStringLiteral(SORT_OPTIONS).withDefault(DEFAULT_SORT),
    minPrice: parseAsString.withDefault(''),
    maxPrice: parseAsString.withDefault(''),
    page: parseAsInteger.withDefault(1),
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isResultsLoading, setIsResultsLoading] = useState(false);
  const [results, setResults] = useState<MenuItemType[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const page = Math.max(1, pageQuery);
  const activeSearch = searchQuery.trim();
  const minPrice = minPriceQuery.trim();
  const maxPrice = maxPriceQuery.trim();
  const [searchInput, setSearchInput] = useState('');

  // Pending filters (what user is selecting)
  const [pendingSelectedCategories, setPendingSelectedCategories] = useState<string[]>([]);
  const [pendingSortBy, setPendingSortBy] = useState<SortOption>(DEFAULT_SORT);
  const [pendingMinPrice, setPendingMinPrice] = useState('');
  const [pendingMaxPrice, setPendingMaxPrice] = useState('');

  const pageSize = 10;

  const categoryNameBySlug = useMemo(() => {
    const entries = categories.map((category) => [toCategorySlug(category.name), category.name]);
    return Object.fromEntries(entries);
  }, [categories]);

  const selectedCategories = useMemo(() => {
    const resolvedCategories = categoryQuery
      .map((value) => {
        const trimmedValue = value.trim();

        if (!trimmedValue) {
          return '';
        }

        if (isObjectId(trimmedValue)) {
          const match = categories.find((category) => category._id === trimmedValue);
          return match ? toCategorySlug(match.name) : trimmedValue;
        }

        return toCategorySlug(trimmedValue);
      })
      .filter(Boolean);

    return Array.from(new Set(resolvedCategories));
  }, [categories, categoryQuery]);
  const selectedCategoryKey = selectedCategories.join(',');
  const selectedCategoryValues = useMemo(
    () => (selectedCategoryKey ? selectedCategoryKey.split(',') : []),
    [selectedCategoryKey]
  );

  const isResultsView =
    activeSearch.length > 0 ||
    selectedCategoryValues.length > 0 ||
    minPrice.length > 0 ||
    maxPrice.length > 0 ||
    sortBy !== DEFAULT_SORT;

  const filterKey = useMemo(
    () =>
      JSON.stringify({
        activeSearch,
        selectedCategories: [...selectedCategoryValues].sort(),
        minPrice,
        maxPrice,
        sortBy,
      }),
    [activeSearch, selectedCategoryValues, minPrice, maxPrice, sortBy]
  );
  const menuQueryString = useMemo(() => {
    const params = new URLSearchParams();

    if (activeSearch) params.set('q', activeSearch);
    if (selectedCategoryValues.length > 0) {
      params.set('categories', selectedCategoryValues.join(','));
    }
    if (sortBy !== DEFAULT_SORT) params.set('sort', sortBy);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (page > 1) params.set('page', String(page));

    return params.toString();
  }, [activeSearch, maxPrice, minPrice, page, selectedCategoryValues, sortBy]);
  const lastFilterKeyRef = useRef(filterKey);

  const getMenuItemPath = useCallback(
    (itemId: string) => {
      return menuQueryString ? `/menu/${itemId}?${menuQueryString}` : `/menu/${itemId}`;
    },
    [menuQueryString]
  );

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    setSearchInput(activeSearch);
    setPendingSelectedCategories(selectedCategoryValues);
    setPendingSortBy(sortBy);
    setPendingMinPrice(minPrice);
    setPendingMaxPrice(maxPrice);
  }, [activeSearch, maxPrice, minPrice, selectedCategoryValues, sortBy]);

  useEffect(() => {
    if (categoryQuery.some(isObjectId) && categories.length > 0) {
      void setMenuQuery({ categories: selectedCategoryValues });
    }
  }, [categories.length, categoryQuery, selectedCategoryValues, setMenuQuery]);

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
    if (isResultsView) return;

    const fetchSummary = async () => {
      setIsSummaryLoading(true);
      try {
        const response = await fetch(`/api/menu-items?groupBy=category&perCategory=3`);
        const data = await response.json();
        const summaries: CategorySummary[] = Array.isArray(data?.categories) ? data.categories : [];
        const summaryItems = summaries.flatMap((summary) => summary.items);

        await preloadMenuItemImages(summaryItems);
        setCategorySummaries(summaries);
      } catch (error) {
        console.error('Error fetching menu summaries:', error);
        setCategorySummaries([]);
      } finally {
        setIsSummaryLoading(false);
        setIsInitialLoading(false);
      }
    };

    fetchSummary();
  }, [isResultsView]);

  useEffect(() => {
    if (!isResultsView) return;

    const controller = new AbortController();

    const fetchResults = async () => {
      setIsResultsLoading(true);

      try {
        const params = new URLSearchParams();
        params.set('limit', String(pageSize));
        params.set('page', String(page));
        params.set('sort', sortBy);

        if (activeSearch) params.set('q', activeSearch);
        if (selectedCategoryValues.length > 0) {
          params.set('categories', selectedCategoryValues.join(','));
        }
        if (minPrice) params.set('minPrice', minPrice);
        if (maxPrice) params.set('maxPrice', maxPrice);

        const response = await fetch(`/api/menu-items?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        const items: MenuItemType[] = Array.isArray(data?.items) ? data.items : [];
        const total = typeof data?.total === 'number' ? data.total : 0;

        await preloadMenuItemImages(items);

        if (controller.signal.aborted) {
          return;
        }

        setTotalResults(total);
        setResults((prev) => (page === 1 ? items : [...prev, ...items]));
      } catch (error) {
        if (!(error instanceof DOMException)) {
          console.error('Error fetching results:', error);
        }
      } finally {
        setIsResultsLoading(false);
        setIsInitialLoading(false);
      }
    };

    fetchResults();

    return () => controller.abort();
  }, [isResultsView, activeSearch, selectedCategoryValues, minPrice, maxPrice, sortBy, page]);

  const handleSearch = () => {
    const trimmedSearch = searchInput.trim();
    void setMenuQuery({ q: trimmedSearch || null, page: 1 });
  };

  const handleResetSearch = () => {
    setSearchInput('');
    void setMenuQuery({ q: null, page: 1 });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleApplyFilters = () => {
    void setMenuQuery({
      categories: pendingSelectedCategories.length > 0 ? pendingSelectedCategories : null,
      sort: pendingSortBy === DEFAULT_SORT ? null : pendingSortBy,
      minPrice: pendingMinPrice || null,
      maxPrice: pendingMaxPrice || null,
      page: 1,
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
    void setMenuQuery({
      categories: null,
      sort: null,
      minPrice: null,
      maxPrice: null,
      page: 1,
    });
  };

  const handleClearAll = () => {
    setSearchInput('');
    setPendingSelectedCategories([]);
    setPendingSortBy(DEFAULT_SORT);
    setPendingMinPrice('');
    setPendingMaxPrice('');
    void setMenuQuery({
      q: null,
      categories: null,
      sort: null,
      minPrice: null,
      maxPrice: null,
      page: 1,
    });
  };

  const handleViewMoreCategory = (categorySlug: string) => {
    setPendingSelectedCategories([categorySlug]);
    void setMenuQuery({ categories: [categorySlug], page: 1 });
  };

  const handleLoadMore = () => {
    if (results.length >= totalResults) return;
    const nextPage = page + 1;
    void setMenuQuery({ page: nextPage });
  };

  const hasActiveFilters =
    selectedCategoryValues.length > 0 ||
    minPrice.length > 0 ||
    maxPrice.length > 0 ||
    sortBy !== DEFAULT_SORT;

  const shouldShowSkeleton =
    isInitialLoading ||
    (isSummaryLoading && categorySummaries.length === 0) ||
    (isResultsLoading && results.length === 0);

  return (
    <main className='max-w-7xl mx-auto px-4 py-12'>
      {shouldShowSkeleton ? (
        <MenuPageSkeleton sectionCount={1} cardsPerSection={3} />
      ) : (
        <>
          <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start'>
            <div className='space-y-10'>
              <div className='space-y-6'>
                <header className='space-y-3'>
                  <h1 className='text-4xl font-bold'>Menu</h1>
                  <p className='text-muted-foreground'>Browse your favorite food and drinks.</p>
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
                    {selectedCategoryValues.map((categorySlug) => (
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
                          <MenuItem key={item._id} item={item} href={getMenuItemPath(item._id)} />
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
                              <MenuItem
                                key={item._id}
                                item={item}
                                href={getMenuItemPath(item._id)}
                              />
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

export default MenuPage;
