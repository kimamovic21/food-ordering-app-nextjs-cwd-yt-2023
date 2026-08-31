import { describe, expect, it } from 'vitest';
import {
  formatAppDate,
  formatAppDateTime,
  formatAppShortDate,
  formatAppTime,
  APP_TIME_ZONE,
  formatWeekdayKey,
  formatWeekdayName,
  toAppTimeZoneDate,
  toDate,
} from '@/libs/dateFormat';

describe('dateFormat helpers', () => {
  it('formats ISO strings with the app date format', () => {
    expect(formatAppDate('2026-07-01T14:05:30.000Z')).toBe('01/07/2026');
  });

  it('formats date-time values with day first output', () => {
    expect(formatAppDateTime('2026-07-01T14:05:30.000Z')).toMatch(/^01\/07\/2026 \d{2}:\d{2}$/);
  });

  it('formats date-time values in the app timezone', () => {
    expect(APP_TIME_ZONE).toBe('Europe/Sarajevo');
    expect(formatAppDateTime('2026-01-01T12:00:00.000Z')).toBe('01/01/2026 13:00');
    expect(toAppTimeZoneDate('2026-01-01T12:00:00.000Z')?.timeZone).toBe(APP_TIME_ZONE);
  });

  it('formats short chart dates with day first output', () => {
    expect(formatAppShortDate('2026-07-01T14:05:30.000Z')).toBe('01/07');
  });

  it('formats time values with two-digit hours and minutes', () => {
    expect(formatAppTime('2026-07-01T04:05:30.000Z')).toMatch(/^\d{2}:\d{2}$/);
  });

  it('returns fallback for invalid input', () => {
    expect(formatAppDate('not-a-date', 'N/A')).toBe('N/A');
    expect(toDate('not-a-date')).toBeNull();
  });

  it('formats weekday names and keys through date-fns', () => {
    expect(formatWeekdayName('2026-07-01T00:00:00.000Z')).toBe('Wednesday');
    expect(formatWeekdayKey('2026-07-01T00:00:00.000Z')).toBe('wednesday');
  });
});
