import { CheckCircle2, CircleDot, PackageCheck, ReceiptText, Truck, Utensils } from 'lucide-react';
import { cn } from '@/libs/utils';

type OrderProgressStepperProps = {
  status:
    'placed' | 'processing' | 'ready' | 'transportation' | 'delivered' | 'completed' | 'canceled';
};

const steps = [
  {
    key: 'placed',
    label: 'Placed',
    Icon: ReceiptText,
  },
  {
    key: 'kitchen',
    label: 'In kitchen',
    Icon: Utensils,
  },
  {
    key: 'transport',
    label: 'In transport',
    Icon: Truck,
  },
  {
    key: 'delivered',
    label: 'Delivered',
    Icon: PackageCheck,
  },
] as const;

const getCurrentStepIndex = (status: OrderProgressStepperProps['status']) => {
  if (status === 'completed' || status === 'delivered') return 3;
  if (status === 'transportation') return 2;
  if (status === 'processing' || status === 'ready') return 1;
  return 0;
};

const OrderProgressStepper = ({ status }: OrderProgressStepperProps) => {
  const currentStepIndex = getCurrentStepIndex(status);
  const isCanceled = status === 'canceled';

  return (
    <div className='rounded-lg border bg-card p-4 shadow-sm'>
      <div className='grid grid-cols-4 gap-2'>
        {steps.map((step, index) => {
          const isCompleted = !isCanceled && index < currentStepIndex;
          const isActive = !isCanceled && index === currentStepIndex;
          const isMuted = isCanceled || index > currentStepIndex;
          const Icon = isCompleted ? CheckCircle2 : isActive ? CircleDot : step.Icon;

          return (
            <div key={step.key} className='relative flex flex-col items-center gap-2 text-center'>
              {index < steps.length - 1 && (
                <span
                  className={cn(
                    'absolute left-[calc(50%+1.5rem)] top-6 h-0.5 w-[calc(100%-3rem)]',
                    isCompleted ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
              <div
                className={cn(
                  'relative z-10 flex size-12 items-center justify-center rounded-full border transition-colors',
                  isCompleted || isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-muted text-muted-foreground',
                  isMuted && 'opacity-45'
                )}
              >
                <Icon className='size-5' />
              </div>
              <span
                className={cn(
                  'text-xs font-semibold sm:text-sm',
                  isCompleted || isActive ? 'text-foreground' : 'text-muted-foreground',
                  isMuted && 'opacity-60'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderProgressStepper;
