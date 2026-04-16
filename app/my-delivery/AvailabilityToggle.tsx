import { Button } from '@/components/ui/button';

interface AvailabilityToggleProps {
  availability: boolean;
  togglingAvailability: boolean;
  onToggle: () => void;
}

const AvailabilityToggle: React.FC<AvailabilityToggleProps> = ({
  availability,
  togglingAvailability,
  onToggle,
}) => (
  <div className='mb-6 flex items-center justify-between bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-6 gap-8 min-w-[600px]'>
    <div className='flex items-center gap-4 flex-1'>
      <div
        className={`w-3 h-3 rounded-full shrink-0 ${availability ? 'bg-green-500' : 'bg-red-500'}`}
      ></div>
      <div>
        <p className='font-semibold text-foreground'>
          Status: {availability ? 'Online' : 'Offline'}
        </p>
        <p className='text-sm text-muted-foreground'>
          {availability ? 'You are available for orders' : 'You are not available for orders'}
        </p>
      </div>
    </div>
    <Button
      onClick={onToggle}
      disabled={togglingAvailability}
      variant={availability ? 'destructive' : 'default'}
      className={`whitespace-nowrap w-[130px] shrink-0 ${
        availability
          ? 'bg-red-600 text-white hover:bg-red-700'
          : 'bg-green-600 text-white hover:bg-green-700'
      }`}
    >
      {togglingAvailability ? 'Updating...' : availability ? 'Go Offline' : 'Go Online'}
    </Button>
  </div>
);

export default AvailabilityToggle;
