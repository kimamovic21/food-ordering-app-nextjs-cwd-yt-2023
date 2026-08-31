'use client';

import { useEffect, useMemo, useState } from 'react';
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
import HeartRating from '@/components/shared/HeartRating';
import Title from '@/components/shared/Title';
import CourierDashboardReviewsLoading from './loading';
import { formatAppDate } from '@/libs/dateFormat';
import type { CourierReviewData, CourierReviewsResponse } from '@/types/review';

const ratingOptions = [
  { label: 'All ratings', value: 'all' },
  { label: '5 stars', value: '5' },
  { label: '4 stars', value: '4' },
  { label: '3 stars', value: '3' },
  { label: '2 stars', value: '2' },
  { label: '1 star', value: '1' },
];

const CourierDashboardReviewsPage = () => {
  const [draftSearch, setDraftSearch] = useState('');
  const [search, setSearch] = useState('');
  const [rating, setRating] = useState('all');
  const [reviews, setReviews] = useState<CourierReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({ averageRating: 0, totalCount: 0 });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(draftSearch.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [draftSearch]);

  useEffect(() => {
    const controller = new AbortController();

    const loadReviews = async () => {
      try {
        setLoading(true);
        setError('');

        const params = new URLSearchParams();
        params.set('mine', 'true');
        if (search) params.set('search', search);
        if (rating !== 'all') params.set('rating', rating);

        const response = await fetch(`/api/courier-reviews?${params.toString()}`, {
          signal: controller.signal,
        });
        const data: CourierReviewsResponse | { error?: string } = await response.json();

        if (!response.ok) {
          throw new Error('error' in data && data.error ? data.error : 'Failed to fetch reviews');
        }

        const result = data as CourierReviewsResponse;
        setReviews(result.reviews || []);
        setSummary({
          averageRating: Number(result.summary?.averageRating || 0),
          totalCount: Number(result.summary?.totalCount || 0),
        });
      } catch (fetchError) {
        if (!(fetchError instanceof DOMException && fetchError.name === 'AbortError')) {
          const message =
            fetchError instanceof Error ? fetchError.message : 'Failed to fetch courier reviews';
          setError(message);
          setReviews([]);
          setSummary({ averageRating: 0, totalCount: 0 });
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadReviews();

    return () => controller.abort();
  }, [rating, search]);

  const activeFilters = useMemo(() => {
    const items: string[] = [];
    if (search) items.push(`customer: ${search}`);
    if (rating !== 'all') items.push(`${rating} stars`);
    return items;
  }, [rating, search]);

  return (
    <section className='space-y-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div className='space-y-2'>
          <Title>My Courier Ratings</Title>
          <p className='max-w-2xl text-sm text-muted-foreground'>
            Browse reviews from customers, filter by rating, and monitor your delivery experience.
          </p>
        </div>
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Sparkles className='h-4 w-4' />
          {summary.totalCount} total review{summary.totalCount === 1 ? '' : 's'}
        </div>
      </div>

      <Card className='border-border/70 bg-card/80'>
        <CardHeader>
          <CardTitle>Overall performance</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <HeartRating rating={summary.averageRating} />
          <p className='text-sm text-muted-foreground'>
            Average rating from all completed deliveries with feedback
          </p>
        </CardContent>
      </Card>

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
                placeholder='Search by customer name'
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
        <CourierDashboardReviewsLoading />
      ) : error ? (
        <Card>
          <CardContent className='py-10 text-center'>
            <p className='text-sm text-muted-foreground'>{error}</p>
          </CardContent>
        </Card>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className='space-y-3 py-14 text-center'>
            <p className='text-base font-medium'>No courier reviews found</p>
            <p className='text-sm text-muted-foreground'>
              Try a different customer name or clear the rating filter.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4'>
          {reviews.map((review) => (
            <Card key={review._id} className='border-border/70 bg-card/80'>
              <CardContent className='space-y-4 p-5'>
                <div className='flex flex-wrap items-start justify-between gap-3'>
                  <div className='space-y-1'>
                    <h3 className='text-base font-semibold text-foreground'>
                      {review.customer?.name || 'Anonymous customer'}
                    </h3>
                    <p className='text-xs text-muted-foreground'>
                      Courier review • {formatAppDate(review.createdAt)} • Order #
                      {review.orderId.slice(-6).toUpperCase()}
                    </p>
                  </div>
                  <HeartRating rating={review.rating} sizeClassName='size-4' showValue={false} />
                </div>

                <p className='whitespace-pre-wrap text-sm leading-6 text-foreground/90'>
                  {review.reviewText}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};

export default CourierDashboardReviewsPage;
