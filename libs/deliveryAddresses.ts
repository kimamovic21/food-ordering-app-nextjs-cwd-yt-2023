import { normalizePhoneNumberForStorage } from '@/libs/phone';
import type { DeliveryAddress, DeliveryAddressInput } from '@/types/user';

export const MAX_SAVED_DELIVERY_ADDRESSES = 5;

type DeliveryAddressValidationResult =
  | {
      ok: true;
      address: DeliveryAddressInput;
    }
  | {
      ok: false;
      error: string;
    };

const normalizeRequiredText = (value: unknown) => String(value ?? '').trim();

const normalizeComparisonText = (value: unknown) =>
  normalizeRequiredText(value).toLowerCase().replace(/\s+/g, ' ');

const normalizeCoordinate = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
};

const normalizeComparisonCoordinate = (value: unknown) => {
  const coordinate = normalizeCoordinate(value);
  return coordinate === null ? null : Number(coordinate.toFixed(5));
};

type DeliveryAddressComparable = Partial<DeliveryAddressInput> &
  Pick<Partial<DeliveryAddress>, '_id' | 'createdAt' | 'updatedAt'>;

export const getDeliveryAddressFingerprint = (address: DeliveryAddressComparable) =>
  [
    normalizeComparisonText(address.phone),
    normalizeComparisonText(address.streetAddress),
    normalizeComparisonText(address.postalCode),
    normalizeComparisonText(address.city),
    normalizeComparisonText(address.country),
    normalizeComparisonCoordinate(address.deliveryLatitude),
    normalizeComparisonCoordinate(address.deliveryLongitude),
  ].join('|');

export const areDeliveryAddressesSame = (
  firstAddress: DeliveryAddressComparable,
  secondAddress: DeliveryAddressComparable
) => getDeliveryAddressFingerprint(firstAddress) === getDeliveryAddressFingerprint(secondAddress);

export const findMatchingDeliveryAddress = <TAddress extends DeliveryAddressComparable>(
  addresses: TAddress[],
  candidateAddress: DeliveryAddressComparable
) => addresses.find((address) => areDeliveryAddressesSame(address, candidateAddress));

export const normalizeDeliveryAddress = (data: unknown): DeliveryAddressValidationResult => {
  const input = (data ?? {}) as Partial<DeliveryAddressInput>;
  const label = normalizeRequiredText(input.label || input.streetAddress || 'Delivery address');
  const phone = normalizeRequiredText(input.phone);
  const streetAddress = normalizeRequiredText(input.streetAddress);
  const postalCode = normalizeRequiredText(input.postalCode);
  const city = normalizeRequiredText(input.city);
  const country = normalizeRequiredText(input.country);
  const deliveryLatitude = normalizeCoordinate(input.deliveryLatitude);
  const deliveryLongitude = normalizeCoordinate(input.deliveryLongitude);

  if (!phone || !streetAddress || !postalCode || !city || !country) {
    return { ok: false, error: 'Please complete all delivery address fields.' };
  }

  const normalizedPhone = normalizePhoneNumberForStorage(phone);
  if (!normalizedPhone) {
    return { ok: false, error: 'Please enter a valid phone number.' };
  }

  if (deliveryLatitude === null || deliveryLongitude === null) {
    return { ok: false, error: 'Please confirm the delivery location before saving this address.' };
  }

  return {
    ok: true,
    address: {
      label: label.slice(0, 60),
      phone: normalizedPhone,
      streetAddress,
      postalCode,
      city,
      country,
      deliveryLatitude,
      deliveryLongitude,
      isDefault: Boolean(input.isDefault),
    },
  };
};

export const serializeDeliveryAddress = (address: any): DeliveryAddress => ({
  _id: String(address?._id || ''),
  label: String(address?.label || 'Delivery address'),
  phone: String(address?.phone || ''),
  streetAddress: String(address?.streetAddress || ''),
  postalCode: String(address?.postalCode || ''),
  city: String(address?.city || ''),
  country: String(address?.country || ''),
  deliveryLatitude: Number(address?.deliveryLatitude),
  deliveryLongitude: Number(address?.deliveryLongitude),
  isDefault: Boolean(address?.isDefault),
  createdAt: address?.createdAt ? new Date(address.createdAt).toISOString() : undefined,
  updatedAt: address?.updatedAt ? new Date(address.updatedAt).toISOString() : undefined,
});

export const serializeDeliveryAddresses = (addresses: any[] = []) =>
  addresses.map(serializeDeliveryAddress).filter((address) => address._id);
