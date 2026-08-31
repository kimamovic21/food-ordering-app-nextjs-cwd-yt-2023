import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PHONE_COUNTRY,
  isValidAppPhoneNumber,
  normalizePhoneNumber,
  normalizePhoneNumberForStorage,
} from '@/libs/phone';

describe('phone helpers', () => {
  it('normalizes local Bosnia and Herzegovina numbers for storage', () => {
    expect(DEFAULT_PHONE_COUNTRY).toBe('BA');
    expect(normalizePhoneNumberForStorage('062128430')).toBe('+38762128430');
  });

  it('accepts already international numbers', () => {
    const phone = normalizePhoneNumber('+38762128430');

    expect(phone).toEqual(
      expect.objectContaining({
        e164: '+38762128430',
        display: '+387 62 128 430',
        country: 'BA',
      })
    );
  });

  it('rejects short or malformed numbers', () => {
    expect(isValidAppPhoneNumber('123')).toBe(false);
    expect(normalizePhoneNumberForStorage('not-a-phone')).toBeNull();
  });
});
