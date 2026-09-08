import { endOfDay, format, startOfDay } from 'date-fns';

export const getRestaurantOperationsDateRange = (date = new Date()) => {
  const start = startOfDay(date);
  const end = endOfDay(date);

  return {
    start,
    end,
    label: format(start, 'dd/MM/yyyy'),
  };
};
