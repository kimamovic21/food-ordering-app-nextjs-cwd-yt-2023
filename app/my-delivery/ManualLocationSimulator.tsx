'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ManualLocationSimulatorProps {
  availability: boolean;
  pollingEnabled: boolean;
  updating: boolean;
  onPollingToggle: () => void;
  onManualUpdate: (latitude: number, longitude: number) => Promise<void>;
}

const ManualLocationSimulator: React.FC<ManualLocationSimulatorProps> = ({
  availability,
  pollingEnabled,
  updating,
  onPollingToggle,
  onManualUpdate,
}) => {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const handleManualSubmit = async () => {
    const parsedLatitude = Number(latitude.trim());
    const parsedLongitude = Number(longitude.trim());

    if (Number.isNaN(parsedLatitude) || Number.isNaN(parsedLongitude)) {
      toast.error('Latitude and longitude must be valid numbers', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
      return;
    }

    if (
      parsedLatitude < -90 ||
      parsedLatitude > 90 ||
      parsedLongitude < -180 ||
      parsedLongitude > 180
    ) {
      toast.error('Coordinates are out of range', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
      return;
    }

    await onManualUpdate(parsedLatitude, parsedLongitude);
  };

  return (
    <div className='mt-6 w-full rounded-xl border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 shadow-2xl p-4 pointer-events-auto'>
      <div className='mb-3'>
        <p className='font-semibold text-foreground'>Dev Courier Simulator</p>
        <p className='text-xs text-muted-foreground'>
          Enter latitude/longitude to simulate courier movement on the map.
        </p>
      </div>

      <div className='grid grid-cols-2 gap-2 mb-3'>
        <Input
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          placeholder='Latitude'
          inputMode='decimal'
          disabled={updating}
        />
        <Input
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          placeholder='Longitude'
          inputMode='decimal'
          disabled={updating}
        />
      </div>

      <div className='space-y-2'>
        <Button
          onClick={handleManualSubmit}
          disabled={updating || !availability}
          className='w-full bg-primary hover:bg-primary/90'
        >
          {updating ? 'Updating Location...' : 'Update Manual Location'}
        </Button>

        <Button onClick={onPollingToggle} className='w-full bg-primary hover:bg-primary/90'>
          {pollingEnabled ? 'Disable Location Polling' : 'Enable Location Polling'}
        </Button>
      </div>
    </div>
  );
};

export default ManualLocationSimulator;
