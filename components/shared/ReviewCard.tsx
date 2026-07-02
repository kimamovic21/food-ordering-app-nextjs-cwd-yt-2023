'use client';

import Link from 'next/link';
import HeartRating from './HeartRating';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatAppDate } from '@/libs/dateFormat';

export type ReviewCardData = {
  _id: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  restaurant?: {
    _id: string;
    name: string;
  } | null;
  user?: {
    name: string;
  } | null;
};

type ReviewCardProps = {
  review: ReviewCardData;
  mode: 'personal' | 'restaurant';
};

const ReviewCard = ({ review, mode }: ReviewCardProps) => {
  const title =
    mode === 'personal'
      ? review.restaurant?.name || 'Restaurant'
      : review.user?.name || 'Anonymous user';

  const href = review.restaurant?._id ? `/restaurants/${review.restaurant._id}` : undefined;

  return (
    <Card className='overflow-hidden border-border/70 bg-card/80'>
      <CardContent className='space-y-4 p-5'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div className='space-y-1'>
            <div className='flex items-center gap-2 flex-wrap'>
              <h3 className='text-base font-semibold text-foreground'>
                {href ? (
                  <Link href={href} className='transition-colors hover:text-primary'>
                    {title}
                  </Link>
                ) : (
                  title
                )}
              </h3>
              <Badge variant='outline' className='rounded-full px-2.5 py-1'>
                {review.rating} star{review.rating === 1 ? '' : 's'}
              </Badge>
            </div>
            <p className='text-xs text-muted-foreground'>
              {mode === 'personal' ? 'Restaurant review' : 'Customer review'} •{' '}
              {formatAppDate(review.createdAt)}
            </p>
          </div>
          <HeartRating rating={review.rating} sizeClassName='size-4' showValue={false} />
        </div>

        <p className='whitespace-pre-wrap text-sm leading-6 text-foreground/90'>
          {review.reviewText}
        </p>
      </CardContent>
    </Card>
  );
};

export default ReviewCard;
