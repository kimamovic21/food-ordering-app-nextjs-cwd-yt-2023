import {
  findMatchingDeliveryAddress,
  getDeliveryAddressFingerprint,
  normalizeDeliveryAddress,
} from '@/libs/deliveryAddresses';
import type { DeliveryAddress, DeliveryAddressInput } from '@/types/user';

const savedAddress: DeliveryAddress = {
  _id: 'address-1',
  label: 'Home',
  phone: '+38761111222',
  streetAddress: 'Main Street 1',
  postalCode: '71000',
  city: 'Sarajevo',
  country: 'Bosnia & Herzegovina',
  deliveryLatitude: 43.8563001,
  deliveryLongitude: 18.4131001,
  isDefault: true,
};

describe('delivery address helpers', () => {
  it('normalizes valid delivery address input before saving', () => {
    const result = normalizeDeliveryAddress({
      label: '  Main Street 1, Sarajevo  ',
      phone: '+38761111222',
      streetAddress: '  Main Street 1  ',
      postalCode: ' 71000 ',
      city: ' Sarajevo ',
      country: ' Bosnia & Herzegovina ',
      deliveryLatitude: '43.8563',
      deliveryLongitude: '18.4131',
    });

    expect(result).toEqual({
      ok: true,
      address: expect.objectContaining({
        label: 'Main Street 1, Sarajevo',
        streetAddress: 'Main Street 1',
        postalCode: '71000',
        city: 'Sarajevo',
        country: 'Bosnia & Herzegovina',
        deliveryLatitude: 43.8563,
        deliveryLongitude: 18.4131,
      }),
    });
  });

  it('finds the same saved address without comparing the display label', () => {
    const candidateAddress: DeliveryAddressInput = {
      label: 'Different display label',
      phone: '+38761111222',
      streetAddress: ' main   street 1 ',
      postalCode: '71000',
      city: 'SARAJEVO',
      country: 'bosnia & herzegovina',
      deliveryLatitude: 43.8563,
      deliveryLongitude: 18.4131,
      isDefault: false,
    };

    expect(findMatchingDeliveryAddress([savedAddress], candidateAddress)).toBe(savedAddress);
  });

  it('treats different coordinates as a different delivery address', () => {
    expect(
      getDeliveryAddressFingerprint({
        ...savedAddress,
        deliveryLatitude: savedAddress.deliveryLatitude + 0.01,
      })
    ).not.toBe(getDeliveryAddressFingerprint(savedAddress));
  });
});
