import { Button } from '@/components/ui/button';

interface LocationShareButtonProps {
  locationShared: boolean;
  sharingLocation: boolean;
  availability: boolean;
  onShare: () => void;
}

const LocationShareButton: React.FC<LocationShareButtonProps> = ({
  locationShared,
  sharingLocation,
  availability,
  onShare,
}) => (
  <div className='mb-6 flex items-center justify-between bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-6 gap-8'>
    <div className='flex items-center gap-4 flex-1'>
      <div className='w-3 h-3 rounded-full shrink-0 bg-primary'></div>
      <div>
        <p className='font-semibold text-foreground'>
          {locationShared ? '✓ Location Shared' : 'Share Your Location'}
        </p>
        <p className='text-sm text-muted-foreground'>
          {locationShared
            ? 'Your location is being tracked by the customer'
            : 'Enable real-time location tracking for this delivery'}
        </p>
      </div>
    </div>
    <Button
      onClick={onShare}
      disabled={sharingLocation || !availability}
      className='whitespace-nowrap w-[140px] shrink-0 bg-primary hover:bg-primary/90'
    >
      {sharingLocation
        ? 'Getting Location...'
        : locationShared
          ? 'Location Shared'
          : 'Share Location'}
    </Button>
  </div>
);

export default LocationShareButton;
