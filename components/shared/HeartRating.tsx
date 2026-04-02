import { Star } from 'lucide-react';

type HeartRatingProps = {
  rating?: number;
  max?: number;
  sizeClassName?: string;
  className?: string;
  showValue?: boolean;
  ratingCount?: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const toHalfStep = (value: number) => Math.round(value * 2) / 2;

const HeartRating = ({
  rating,
  max = 5,
  sizeClassName = 'size-4',
  className = '',
  showValue = true,
  ratingCount,
}: HeartRatingProps) => {
  const safeRating = Number.isFinite(rating) ? Number(rating) : 0;
  const normalized = toHalfStep(clamp(safeRating, 0, max));

  return (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      <div className='flex items-center gap-0.5'>
        {Array.from({ length: max }).map((_, index) => {
          const starValue = normalized - index;
          const isFull = starValue >= 1;
          const isHalf = !isFull && starValue >= 0.5;
          const clipClass = isFull ? 'inset-0' : 'inset-y-0 left-0 right-1/2';

          if (isFull || isHalf) {
            return (
              <span key={index} className='relative inline-flex items-center justify-center'>
                <Star className={`${sizeClassName} text-muted-foreground/40`} />
                <span className={`pointer-events-none absolute overflow-hidden ${clipClass}`}>
                  <span className='flex h-full w-full items-center justify-center'>
                    <Star className={`${sizeClassName} fill-primary text-primary`} />
                  </span>
                </span>
              </span>
            );
          }

          return <Star key={index} className={`${sizeClassName} text-muted-foreground/40`} />;
        })}
      </div>

      {showValue && (
        <span className='text-xs text-muted-foreground'>
          {normalized.toFixed(1)}/5
          {typeof ratingCount === 'number' ? ` (${ratingCount})` : ''}
        </span>
      )}
    </div>
  );
};

export default HeartRating;
