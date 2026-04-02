'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Link from 'next/link';
import Image from 'next/image';
import Title from '@/components/shared/Title';
import HeartRating from '@/components/shared/HeartRating';
import RestaurantReviewsLoading from './loading';

type ReviewItem = {
  _id: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  user: {
    name: string;
    image: string | null;
  };
};

type ReviewsResponse = {
  restaurant: {
    _id: string;
    name: string;
  };
  reviews: ReviewItem[];
  meta: {
    totalCount: number;
    offset: number;
    limit: number;
    nextOffset: number;
    hasMore: boolean;
  };
};

const INITIAL_LIMIT = 10;

const RestaurantReviewsPage = () => {
  const params = useParams();
  const id = params?.id as string;

  const [restaurantName, setRestaurantName] = useState('Restaurant');
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const fetchReviews = useCallback(
    async (offset: number, append: boolean) => {
      const response = await fetch(
        `/api/restaurants/${id}/reviews?limit=${INITIAL_LIMIT}&offset=${offset}`
      );
      const data = (await response.json()) as ReviewsResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reviews');
      }

      setRestaurantName(data.restaurant?.name || 'Restaurant');
      setTotalCount(Number(data.meta?.totalCount) || 0);
      setHasMore(Boolean(data.meta?.hasMore));
      setNextOffset(Number(data.meta?.nextOffset) || 0);

      setReviews((prev) => (append ? [...prev, ...data.reviews] : data.reviews));
    },
    [id]
  );

  useEffect(() => {
    if (!id) return;

    const loadInitialReviews = async () => {
      try {
        setLoading(true);
        setError('');
        await fetchReviews(0, false);
      } catch (loadError) {
        console.error(loadError);
        setError('Failed to load reviews and ratings');
      } finally {
        setLoading(false);
      }
    };

    loadInitialReviews();
  }, [id, fetchReviews]);

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      await fetchReviews(nextOffset, true);
    } catch (loadError) {
      console.error(loadError);
      setError('Failed to load more reviews and ratings');
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return <RestaurantReviewsLoading />;
  }

  if (error) {
    return (
      <section className='mt-8 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10'>
        <Breadcrumb className='mb-6'>
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
              <BreadcrumbPage>Reviews and ratings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardContent className='py-10 text-center'>
            <p className='text-muted-foreground mb-4'>{error}</p>
            <Link href={`/restaurants/${id}`}>
              <Button variant='outline'>Back to restaurant details</Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className='mt-8 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10'>
      <Breadcrumb className='mb-6'>
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
            <BreadcrumbPage>Reviews and ratings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className='mb-6 space-y-2'>
        <Title>{restaurantName} Reviews and Ratings</Title>
        <p className='text-sm text-muted-foreground'>
          {totalCount} review{totalCount === 1 ? '' : 's'} submitted by customers.
        </p>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No reviews yet</CardTitle>
            <CardDescription>
              This restaurant has no submitted reviews at the moment.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className='space-y-4'>
          {reviews.map((review) => (
            <Card key={review._id}>
              <CardHeader>
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex items-center gap-3'>
                    {review.user.image ? (
                      <Image
                        src={review.user.image}
                        alt={review.user.name}
                        width={40}
                        height={40}
                        className='h-10 w-10 rounded-full object-cover border border-border'
                      />
                    ) : (
                      <div className='h-10 w-10 rounded-full border border-border bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground'>
                        {review.user.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className='text-sm font-semibold'>{review.user.name}</p>
                      <p className='text-xs text-muted-foreground'>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <HeartRating rating={review.rating} ratingCount={undefined} />
                </div>
              </CardHeader>
              <CardContent>
                <p className='text-sm leading-6 text-foreground/90'>{review.reviewText}</p>
              </CardContent>
            </Card>
          ))}

          {hasMore && (
            <div className='flex justify-center pt-2'>
              <Button onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading...' : 'View more reviews and ratings'}
              </Button>
            </div>
          )}
        </div>
      )}

      <div className='mt-8'>
        <Link href={`/restaurants/${id}`}>
          <Button variant='outline'>Back to restaurant details</Button>
        </Link>
      </div>
    </section>
  );
};

export default RestaurantReviewsPage;
