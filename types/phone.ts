import type { CountryCode } from 'libphonenumber-js';

export type PhoneCountryCode = CountryCode;

export type NormalizedPhoneNumber = {
  input: string;
  e164: string;
  display: string;
  country?: PhoneCountryCode;
};
