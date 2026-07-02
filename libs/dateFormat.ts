import { format, isValid, parseISO } from 'date-fns';

export const APP_DATE_FORMAT = 'dd/MM/yyyy';
export const APP_DATE_TIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const APP_SHORT_DATE_FORMAT = 'dd/MM';
export const APP_TIME_FORMAT = 'HH:mm';

type DateInput = Date | string | number | null | undefined;

export const toDate = (value: DateInput) => {
  if (!value) {
    return null;
  }

  const date =
    value instanceof Date ? value : typeof value === 'string' ? parseISO(value) : new Date(value);

  return isValid(date) ? date : null;
};

export const formatAppDate = (value: DateInput, fallback = '-') => {
  const date = toDate(value);

  return date ? format(date, APP_DATE_FORMAT) : fallback;
};

export const formatAppDateTime = (value: DateInput, fallback = '-') => {
  const date = toDate(value);

  return date ? format(date, APP_DATE_TIME_FORMAT) : fallback;
};

export const formatAppShortDate = (value: DateInput, fallback = '-') => {
  const date = toDate(value);

  return date ? format(date, APP_SHORT_DATE_FORMAT) : fallback;
};

export const formatAppTime = (value: DateInput, fallback = '-') => {
  const date = toDate(value);

  return date ? format(date, APP_TIME_FORMAT) : fallback;
};

export const formatWeekdayName = (value: DateInput, fallback = '') => {
  const date = toDate(value);

  return date ? format(date, 'EEEE') : fallback;
};

export const formatWeekdayKey = (value: DateInput, fallback = '') =>
  formatWeekdayName(value, fallback).toLowerCase();
