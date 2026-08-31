import { parsePhoneNumberFromString } from 'libphonenumber-js';
import type { NormalizedPhoneNumber, PhoneCountryCode } from '@/types/phone';

export type { NormalizedPhoneNumber, PhoneCountryCode } from '@/types/phone';

export const DEFAULT_PHONE_COUNTRY: PhoneCountryCode = 'BA';

export const normalizePhoneNumber = (
  value: unknown,
  defaultCountry: PhoneCountryCode = DEFAULT_PHONE_COUNTRY
): NormalizedPhoneNumber | null => {
  const input = String(value ?? '').trim();

  if (!input) {
    return null;
  }

  const parsedPhone = parsePhoneNumberFromString(input, defaultCountry);

  if (!parsedPhone || !parsedPhone.isPossible() || !parsedPhone.isValid()) {
    return null;
  }

  return {
    input,
    e164: parsedPhone.number,
    display: parsedPhone.formatInternational(),
    country: parsedPhone.country,
  };
};

export const normalizePhoneNumberForStorage = (
  value: unknown,
  defaultCountry: PhoneCountryCode = DEFAULT_PHONE_COUNTRY
) => normalizePhoneNumber(value, defaultCountry)?.e164 ?? null;

export const isValidAppPhoneNumber = (
  value: unknown,
  defaultCountry: PhoneCountryCode = DEFAULT_PHONE_COUNTRY
) => normalizePhoneNumber(value, defaultCountry) !== null;
