'use client';

import { useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import HeartRating from '@/components/shared/HeartRating';

type LeaveCourierReviewDialogProps = {
  orderId: string;
  orderStatus:
    | 'placed'
    | 'processing'
    | 'ready'
    | 'transportation'
    | 'delivered'
    | 'completed'
    | 'canceled';
  paymentStatus: boolean;
  hasCourier: boolean;
  onSubmitted?: (review: { rating: number; reviewText: string }) => void;
};

const getRatingLabel = (value: number) => {
  if (value >= 4.5) return 'Excellent';
  if (value >= 4) return 'Very good';
  if (value >= 3) return 'Good';
  if (value >= 2) return 'Fair';
  return 'Poor';
};

const LeaveCourierReviewDialog = ({
  orderId,
  orderStatus,
  paymentStatus,
  hasCourier,
  onSubmitted,
}: LeaveCourierReviewDialogProps) => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const canLeaveReview = useMemo(
    () => orderStatus === 'completed' && paymentStatus && hasCourier,
    [orderStatus, paymentStatus, hasCourier]
  );

  const handleStarClick = (index: number) => {
    setRating(index + 1);
  };

  const handleSubmit = async () => {
    const trimmedReview = reviewText.trim();

    if (trimmedReview.length < 5) {
      toast.error('Review must contain at least 5 characters');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch('/api/courier-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          rating,
          reviewText: trimmedReview,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to submit courier review');
      }

      toast.success('Courier review submitted successfully', {
        style: {
          background: '#16a34a',
          color: 'white',
        },
      });
      onSubmitted?.({ rating, reviewText: trimmedReview });
      setOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit courier review';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!canLeaveReview} variant='outline'>
          Leave review and rating for courier
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className='sm:max-w-2xl p-0 overflow-hidden'>
        <DialogHeader className='border-b border-border px-6 py-5 bg-linear-to-r from-primary/10 via-transparent to-primary/5'>
          <DialogTitle className='text-2xl'>Leave a courier review</DialogTitle>
          <DialogDescription className='text-sm'>
            Share your delivery experience to help other users.
          </DialogDescription>
        </DialogHeader>

        {!canLeaveReview ? (
          <div className='px-6 pb-6 pt-4'>
            <p className='text-sm text-muted-foreground'>
              Courier reviews can be submitted only after the order is completed, paid, and assigned
              to a courier.
            </p>
          </div>
        ) : (
          <div className='px-6 pb-6 pt-4 space-y-5'>
            <div className='rounded-xl border border-border bg-card/60 p-4'>
              <div className='flex items-center justify-between gap-2 mb-3'>
                <Label className='text-sm font-semibold'>Star Rating</Label>
                <span className='text-xs font-medium rounded-full bg-primary/10 text-primary px-3 py-1'>
                  {getRatingLabel(rating)}
                </span>
              </div>

              <div className='rounded-2xl border border-border bg-muted/40 px-3 py-3'>
                <div className='flex items-center justify-center gap-2'>
                  {Array.from({ length: 5 }).map((_, index) => {
                    const value = rating - index;
                    const isFull = value >= 1;

                    return (
                      <button
                        type='button'
                        key={index}
                        onClick={() => handleStarClick(index)}
                        className='group relative isolate flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 m-0 shadow-none appearance-none outline-none transition-transform duration-150 hover:scale-110 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                        aria-label={`Set rating to ${index + 1}`}
                      >
                        <Star className='size-9 text-muted-foreground/30 transition-colors' />
                        {isFull && (
                          <span className='pointer-events-none absolute inset-0 overflow-hidden'>
                            <span className='flex h-full w-full items-center justify-center'>
                              <Star className='size-9 fill-primary text-primary' />
                            </span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className='mt-2 flex items-center justify-center'>
                  <HeartRating rating={rating} sizeClassName='size-5' className='gap-3' />
                </div>
              </div>
            </div>

            <div className='space-y-2 rounded-xl border border-border bg-card/60 p-4'>
              <Label htmlFor='courierReviewText' className='text-sm font-semibold'>
                Courier review
              </Label>
              <Textarea
                id='courierReviewText'
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                maxLength={1000}
                placeholder='How was the delivery, communication, and professionalism?'
                rows={5}
                className='resize-none'
              />
              <div className='flex items-center justify-between'>
                <p className='text-xs text-muted-foreground'>Minimum 5 characters</p>
                <p className='text-xs text-muted-foreground'>{reviewText.trim().length}/1000</p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className='px-6 pb-6 pt-0'>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canLeaveReview || submitting}>
            {submitting ? 'Saving...' : 'Submit courier review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LeaveCourierReviewDialog;
