'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, MessageCircleHeart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import HeartRating from '@/components/shared/HeartRating';
import Title from '@/components/shared/Title';
import { formatAppDate } from '@/libs/dateFormat';

type CourierReviewItem = {
  _id: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  customer?: {
    name?: string;
  };
};

type CourierData = {
  _id: string;
  name: string;
  image?: string | null;
};

type CourierReviewsResponse = {
  courier: CourierData;
  reviews: CourierReviewItem[];
  summary: {
    averageRating: number;
    totalCount: number;
  };
};

const CourierReviewsPage = () => {
  const params = useParams();
  const orderId = String(params?.id || '');
  const courierId = String(params?.courierId || '');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<CourierReviewsResponse | null>(null);

  useEffect(() => {
    const loadCourierReviews = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`/api/courier-reviews?courierId=${courierId}`);
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json?.error || 'Failed to load courier reviews');
        }

        setData(json);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : 'Failed to load courier reviews';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    if (courierId) {
      loadCourierReviews();
    }
  }, [courierId]);

  if (loading) {
    return (
      <section className='mt-8 space-y-4'>
        <Skeleton className='h-8 w-60' />
        <Skeleton className='h-44 w-full' />
        <Skeleton className='h-36 w-full' />
      </section>
    );
  }

  if (error) {
    return (
      <section className='mt-8 space-y-4'>
        <Link
          href={`/my-orders/${orderId}`}
          className='inline-flex items-center gap-2 text-sm hover:text-primary'
        >
          <ArrowLeft className='size-4' />
          Back to order details
        </Link>
        <Card>
          <CardContent className='py-8'>
            <p className='text-sm text-red-600'>{error}</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  const courierInitials = data.courier.name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className='mt-8 space-y-6'>
      <Link
        href={`/my-orders/${orderId}`}
        className='inline-flex items-center gap-2 text-sm hover:text-primary'
      >
        <ArrowLeft className='size-4' />
        Back to order details
      </Link>

      <div className='space-y-2'>
        <Title>Courier Reviews and Ratings</Title>
        <p className='text-sm text-muted-foreground'>
          Read what customers shared about this courier&apos;s delivery service.
        </p>
      </div>

      <Card>
        <CardContent className='py-5'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-center gap-3'>
              <Avatar className='size-12'>
                <AvatarImage src={data.courier.image || undefined} alt={data.courier.name} />
                <AvatarFallback>{courierInitials}</AvatarFallback>
              </Avatar>
              <div>
                <p className='text-base font-semibold'>{data.courier.name}</p>
                <p className='text-sm text-muted-foreground'>Delivery courier</p>
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <HeartRating rating={data.summary.averageRating} />
              <Badge variant='outline' className='rounded-full'>
                {data.summary.totalCount} review{data.summary.totalCount === 1 ? '' : 's'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {data.reviews.length === 0 ? (
        <Card>
          <CardContent className='py-12 text-center'>
            <MessageCircleHeart className='mx-auto mb-3 size-8 text-muted-foreground' />
            <p className='text-base font-medium'>No courier reviews yet</p>
            <p className='text-sm text-muted-foreground mt-1'>
              Once customers submit feedback, it will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4'>
          {data.reviews.map((review) => (
            <Card key={review._id} className='border-border/70'>
              <CardHeader>
                <div className='flex items-center justify-between gap-3'>
                  <div>
                    <CardTitle className='text-base'>
                      {review.customer?.name || 'Anonymous customer'}
                    </CardTitle>
                    <CardDescription>{formatAppDate(review.createdAt)}</CardDescription>
                  </div>
                  <HeartRating rating={review.rating} sizeClassName='size-4' />
                </div>
              </CardHeader>
              <CardContent>
                <p className='text-sm leading-6'>{review.reviewText}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};

export default CourierReviewsPage;
