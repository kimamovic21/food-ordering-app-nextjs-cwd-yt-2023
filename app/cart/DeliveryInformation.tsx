import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Save, Star, Trash2 } from 'lucide-react';
import DevDeliveryLocationDialog from './DevDeliveryLocationDialog';
import type { DeliveryAddress } from '@/types/user';

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
    specialInstructions: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  deliveryRadiusKm?: number | null;
  deliveryDistanceKm?: number | null;
  isGettingDeliveryLocation: boolean;
  onUseCurrentLocation: () => void;
  onManualLocationUpdate: (latitude: number, longitude: number) => void;
  savedAddresses?: DeliveryAddress[];
  selectedAddressId?: string;
  loadingSavedAddresses?: boolean;
  savingDeliveryAddress?: boolean;
  deletingDeliveryAddress?: boolean;
  settingDefaultDeliveryAddress?: boolean;
  canSaveDeliveryAddress?: boolean;
  onSelectSavedAddress?: (addressId: string) => void;
  onSaveCurrentAddress?: () => void;
  onDeleteSelectedAddress?: () => void;
  onSetDefaultAddress?: () => void;
}

const DeliveryInformation: React.FC<DeliveryInformationProps> = ({
  email,
  formData,
  handleInputChange,
  deliveryRadiusKm,
  deliveryDistanceKm,
  isGettingDeliveryLocation,
  onUseCurrentLocation,
  onManualLocationUpdate,
  savedAddresses = [],
  selectedAddressId = '',
  loadingSavedAddresses = false,
  savingDeliveryAddress = false,
  deletingDeliveryAddress = false,
  settingDefaultDeliveryAddress = false,
  canSaveDeliveryAddress = false,
  onSelectSavedAddress,
  onSaveCurrentAddress,
  onDeleteSelectedAddress,
  onSetDefaultAddress,
}) => {
  const hasDeliveryLocation =
    typeof formData.deliveryLatitude === 'number' && typeof formData.deliveryLongitude === 'number';
  const selectedSavedAddress = savedAddresses.find((address) => address._id === selectedAddressId);

  return (
    <div className='bg-card border rounded-xl p-4 sm:p-6 lg:max-h-[70vh] lg:overflow-y-auto'>
      <h3 className='text-lg font-bold text-foreground mb-4'>Delivery Information</h3>
      <div className='mb-4'>
        <Label className='mb-2'>Email</Label>
        <Input type='email' value={email} disabled />
      </div>
      {(loadingSavedAddresses || savedAddresses.length > 0) && (
        <div className='mb-4 rounded-lg border bg-muted/20 p-3'>
          <Label className='mb-2'>Saved addresses</Label>
          <Select
            value={selectedAddressId}
            onValueChange={(value) => onSelectSavedAddress?.(value)}
            disabled={loadingSavedAddresses}
          >
            <SelectTrigger className='w-full'>
              <SelectValue
                placeholder={
                  loadingSavedAddresses ? 'Loading saved addresses...' : 'Choose saved address'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {savedAddresses.map((address) => (
                <SelectItem key={address._id} value={address._id}>
                  {address.label}
                  {address.isDefault ? ' (default)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedSavedAddress && (
            <div className='mt-3 flex flex-wrap gap-2'>
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={onSetDefaultAddress}
                disabled={selectedSavedAddress.isDefault || settingDefaultDeliveryAddress}
              >
                <Star className='size-4' aria-hidden='true' />
                {selectedSavedAddress.isDefault ? 'Default' : 'Make default'}
              </Button>
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={onDeleteSelectedAddress}
                disabled={deletingDeliveryAddress}
              >
                <Trash2 className='size-4' aria-hidden='true' />
                Delete
              </Button>
            </div>
          )}
        </div>
      )}
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

      <div className='mb-6'>
        <Label htmlFor='specialInstructions' className='mb-2'>
          Special instructions
        </Label>
        <Textarea
          id='specialInstructions'
          name='specialInstructions'
          value={formData.specialInstructions}
          onChange={handleInputChange}
          maxLength={500}
          rows={4}
          placeholder='No onions, cut pizza, call when outside...'
        />
        <p className='mt-1 text-xs text-muted-foreground'>
          Optional notes for the restaurant and courier. Please do not add paid extras here.
        </p>
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
            <DevDeliveryLocationDialog onManualLocationUpdate={onManualLocationUpdate} />
            {onSaveCurrentAddress && (
              <Button
                type='button'
                variant='secondary'
                size='sm'
                className='mt-3 ml-2'
                onClick={onSaveCurrentAddress}
                disabled={!canSaveDeliveryAddress || savingDeliveryAddress}
              >
                <Save className='size-4' aria-hidden='true' />
                {savingDeliveryAddress ? 'Saving...' : 'Save address'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryInformation;
