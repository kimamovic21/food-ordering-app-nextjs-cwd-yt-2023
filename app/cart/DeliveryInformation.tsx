import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';

interface DeliveryInformationProps {
  email: string;
  formData: {
    phone: string;
    streetAddress: string;
    postalCode: string;
    city: string;
    country: string;
    deliveryLatitude: number | null;
    deliveryLongitude: number | null;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  deliveryRadiusKm?: number | null;
  deliveryDistanceKm?: number | null;
  isGettingDeliveryLocation: boolean;
  onUseCurrentLocation: () => void;
}

const DeliveryInformation: React.FC<DeliveryInformationProps> = ({
  email,
  formData,
  handleInputChange,
  deliveryRadiusKm,
  deliveryDistanceKm,
  isGettingDeliveryLocation,
  onUseCurrentLocation,
}) => {
  const hasDeliveryLocation =
    typeof formData.deliveryLatitude === 'number' && typeof formData.deliveryLongitude === 'number';

  return (
    <div className='bg-card border rounded-xl p-4 sm:p-6 lg:max-h-[70vh] lg:overflow-y-auto'>
      <h3 className='text-lg font-bold text-foreground mb-4'>Delivery Information</h3>
      <div className='mb-4'>
        <Label className='mb-2'>Email</Label>
        <Input type='email' value={email} disabled />
      </div>
      <div className='mb-4'>
        <Label htmlFor='phone' className='mb-2'>
          Phone
        </Label>
        <Input
          type='tel'
          id='phone'
          name='phone'
          value={formData.phone}
          onChange={handleInputChange}
          placeholder='Your phone number'
        />
      </div>
      <div className='mb-4'>
        <Label htmlFor='streetAddress' className='mb-2'>
          Street Address
        </Label>
        <Input
          type='text'
          id='streetAddress'
          name='streetAddress'
          value={formData.streetAddress}
          onChange={handleInputChange}
          placeholder='Your street address'
        />
      </div>
      <div className='mb-4'>
        <Label htmlFor='postalCode' className='mb-2'>
          Postal Code
        </Label>
        <Input
          type='text'
          id='postalCode'
          name='postalCode'
          value={formData.postalCode}
          onChange={handleInputChange}
          placeholder='Your postal code'
        />
      </div>
      <div className='mb-4'>
        <Label htmlFor='city' className='mb-2'>
          City
        </Label>
        <Input
          type='text'
          id='city'
          name='city'
          value={formData.city}
          onChange={handleInputChange}
          placeholder='Your city'
        />
      </div>
      <div className='mb-6'>
        <Label htmlFor='country' className='mb-2'>
          Country
        </Label>
        <Input
          type='text'
          id='country'
          name='country'
          value={formData.country}
          onChange={handleInputChange}
          placeholder='Your country'
        />
      </div>

      <div className='rounded-lg border bg-muted/30 p-3'>
        <div className='flex items-start gap-3'>
          <MapPin className='mt-0.5 h-4 w-4 text-primary' />
          <div className='min-w-0 flex-1'>
            <p className='text-sm font-medium'>Delivery radius check</p>
            <p className='mt-1 text-xs text-muted-foreground'>
              {deliveryRadiusKm
                ? `This restaurant delivers within ${deliveryRadiusKm} km.`
                : 'Confirm your location before checkout.'}
            </p>
            {hasDeliveryLocation && (
              <p className='mt-1 text-xs text-green-600'>
                Location confirmed
                {typeof deliveryDistanceKm === 'number'
                  ? `, about ${deliveryDistanceKm.toFixed(1)} km from restaurant`
                  : ''}
                .
              </p>
            )}
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='mt-3'
              onClick={onUseCurrentLocation}
              disabled={isGettingDeliveryLocation}
            >
              {isGettingDeliveryLocation ? 'Checking location...' : 'Use current location'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryInformation;
