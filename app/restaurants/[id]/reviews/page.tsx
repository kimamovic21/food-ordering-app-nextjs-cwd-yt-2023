'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Filter, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import HeartRating from '@/components/shared/HeartRating';
import Title from '@/components/shared/Title';
import ReviewCard, { type ReviewCardData } from '@/components/shared/ReviewCard';
import RestaurantReviewsLoading from './loading';

type RestaurantReviewsResponse = {
  restaurant: {
    _id: string;
    name: string;
  };
  reviews: ReviewCardData[];
  meta: {
    totalCount: number;
    offset: number;
    limit: number;
    nextOffset: number;
    hasMore: boolean;
  };
};

const ratingOptions = [
  { label: 'All ratings', value: 'all' },
  { label: '5 stars', value: '5' },
  { label: '4 stars', value: '4' },
  { label: '3 stars', value: '3' },
  { label: '2 stars', value: '2' },
  { label: '1 star', value: '1' },
];

const RestaurantReviewsPage = () => {
  const params = useParams();
  const id = params?.id as string;
  const hasLoadedRef = useRef(false);

  const [restaurantName, setRestaurantName] = useState('Restaurant reviews');
  const [averageRating, setAverageRating] = useState(0);
  const [reviews, setReviews] = useState<ReviewCardData[]>([]);
  const [rating, setRating] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    const loadReviews = async () => {
      try {
        if (hasLoadedRef.current) {
          setIsRefreshing(true);
        } else {
          setLoading(true);
        }
        setError('');

        const params = new URLSearchParams({ limit: '1000' });
        if (rating !== 'all') params.set('rating', rating);

        const response = await fetch(`/api/restaurants/${id}/reviews?${params.toString()}`, {
          signal: controller.signal,
        });
        const data: RestaurantReviewsResponse | { error?: string } = await response.json();

        if (!response.ok) {
          throw new Error(
            'error' in data && data.error ? data.error : 'Failed to fetch restaurant reviews'
          );
        }

        const result = data as RestaurantReviewsResponse;
        setRestaurantName(result.restaurant?.name || 'Restaurant reviews');
        setReviews(result.reviews || []);
        setTotalCount(result.meta?.totalCount ?? result.reviews?.length ?? 0);
        const totalRating = (result.reviews || []).reduce((sum, review) => sum + review.rating, 0);
        setAverageRating(result.reviews?.length ? totalRating / result.reviews.length : 0);
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
          setIsRefreshing(false);
          hasLoadedRef.current = true;
        }
      }
    };

    loadReviews();

    return () => controller.abort();
  }, [id, rating]);

  const activeFilters = useMemo(() => (rating !== 'all' ? [`${rating} stars`] : []), [rating]);

  if (loading) {
    return <RestaurantReviewsLoading />;
  }

  return (
    <section className='mt-8 space-y-6 w-full'>
      <Breadcrumb>
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
            <BreadcrumbPage>Restaurant reviews</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className='space-y-2'>
        <Title>{restaurantName}</Title>
        <p className='max-w-2xl text-sm text-muted-foreground'>
          Browse all reviews for this restaurant and filter them by star rating.
        </p>
      </div>

      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]'>
        <div className='space-y-4'>
          <Card className='border-border/70 bg-card/80'>
            <CardHeader>
              <CardTitle>Review summary</CardTitle>
            </CardHeader>
            <CardContent className='flex flex-wrap items-center gap-4 text-sm'>
              <div className='flex items-center gap-2'>
                <Sparkles className='h-4 w-4 text-muted-foreground' />
                {totalCount} review{totalCount === 1 ? '' : 's'}
              </div>
              <HeartRating rating={averageRating} ratingCount={totalCount} />
              {isRefreshing && <span className='text-xs text-muted-foreground'>Updating...</span>}
            </CardContent>
          </Card>

          {error ? (
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
                  Try a different rating filter or check back later.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className='grid gap-4'>
              {reviews.map((review) => (
                <ReviewCard key={review._id} review={review} mode='restaurant' />
              ))}
            </div>
          )}
        </div>

        <Card className='border-border/70 bg-card/80 h-fit lg:sticky lg:top-24'>
          <CardHeader>
            <CardTitle>Filter</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Filter className='h-4 w-4' />
              Filter by rating only
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
                  onClick={() => setRating('all')}
                >
                  Clear filter
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default RestaurantReviewsPage;
