'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import ReviewCard from '@/components/shared/ReviewCard';
import Link from 'next/link';
import Title from '@/components/shared/Title';
import type { ReviewCardData, ReviewsResponse } from '@/types/review';

const ratingOptions = [
  { label: 'All ratings', value: 'all' },
  { label: '5 stars', value: '5' },
  { label: '4 stars', value: '4' },
  { label: '3 stars', value: '3' },
  { label: '2 stars', value: '2' },
  { label: '1 star', value: '1' },
];

const ReviewsPage = () => {
  const session = useSession();
  const [draftSearch, setDraftSearch] = useState('');
  const [search, setSearch] = useState('');
  const [rating, setRating] = useState('all');
  const [reviews, setReviews] = useState<ReviewCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(draftSearch.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [draftSearch]);

  useEffect(() => {
    if (session.status === 'unauthenticated') {
      setLoading(false);
      setReviews([]);
      return;
    }

    const controller = new AbortController();

    const loadReviews = async () => {
      try {
        setLoading(true);
        setError('');

        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (rating !== 'all') params.set('rating', rating);

        const response = await fetch(`/api/reviews?${params.toString()}`, {
          signal: controller.signal,
        });
        const data: ReviewsResponse | { error?: string } = await response.json();

        if (!response.ok) {
          throw new Error('error' in data && data.error ? data.error : 'Failed to fetch reviews');
        }

        const result = data as ReviewsResponse;
        setReviews(result.reviews || []);
        setTotalCount(result.meta?.totalCount ?? result.reviews?.length ?? 0);
      } catch (fetchError) {
        if (!(fetchError instanceof DOMException && fetchError.name === 'AbortError')) {
          const message =
            fetchError instanceof Error ? fetchError.message : 'Failed to fetch reviews';
          setError(message);
          setReviews([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (session.status === 'authenticated') {
      loadReviews();
    }

    return () => controller.abort();
  }, [rating, search, session.status]);

  const activeFilters = useMemo(() => {
    const items: string[] = [];
    if (search) items.push(`restaurant: ${search}`);
    if (rating !== 'all') items.push(`${rating} stars`);
    return items;
  }, [rating, search]);

  if (session.status === 'loading') {
    return (
      <section className='space-y-6'>
        <div className='space-y-3'>
          <Skeleton className='h-10 w-56' />
          <Skeleton className='h-5 w-96' />
        </div>
        <Card>
          <CardContent className='space-y-4 p-6'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-40 w-full' />
          </CardContent>
        </Card>
      </section>
    );
  }

  if (session.status === 'unauthenticated') {
    return (
      <section className='space-y-6'>
        <div className='space-y-2'>
          <Title>My Reviews</Title>
          <p className='text-sm text-muted-foreground'>
            Sign in to view the reviews you have submitted.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Authentication required</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-sm text-muted-foreground'>
              This page shows only your own restaurant reviews and ratings.
            </p>
            <div className='flex flex-wrap gap-3'>
              <Link href='/login'>
                <Button>Login</Button>
              </Link>
              <Link href='/register'>
                <Button variant='outline'>Create account</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className='space-y-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div className='space-y-2'>
          <Title>My Reviews</Title>
          <p className='max-w-2xl text-sm text-muted-foreground'>
            Browse every review you have submitted, search by restaurant name, and filter by star
            rating.
          </p>
        </div>
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Sparkles className='h-4 w-4' />
          {totalCount} review{totalCount === 1 ? '' : 's'}
        </div>
      </div>

      <Card className='border-border/70 bg-card/80'>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]'>
            <div className='relative'>
              <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                value={draftSearch}
                onChange={(event) => setDraftSearch(event.target.value)}
                placeholder='Search by restaurant name'
                className='pl-9'
              />
            </div>

            <Select value={rating} onValueChange={setRating}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Filter by rating' />
              </SelectTrigger>
              <SelectContent>
                {ratingOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {activeFilters.length > 0 && (
            <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
              <span>Active filters:</span>
              {activeFilters.map((item) => (
                <span key={item} className='rounded-full border border-border px-2.5 py-1'>
                  {item}
                </span>
              ))}
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='h-7 px-2 text-xs'
                onClick={() => {
                  setDraftSearch('');
                  setSearch('');
                  setRating('all');
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className='grid gap-4'>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className='h-40 w-full rounded-xl' />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className='py-10 text-center'>
            <p className='text-sm text-muted-foreground'>{error}</p>
          </CardContent>
        </Card>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className='space-y-3 py-14 text-center'>
            <p className='text-base font-medium'>No reviews found</p>
            <p className='text-sm text-muted-foreground'>
              Try a different restaurant name or clear the rating filter.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4'>
          {reviews.map((review) => (
            <ReviewCard key={review._id} review={review} mode='personal' />
          ))}
        </div>
      )}
    </section>
  );
};

export default ReviewsPage;
