import { formatWeekdayKey, formatWeekdayName } from '@/libs/dateFormat';
import type { RestaurantBlockedDate, RestaurantWorkingHour } from '@/types/restaurant';

export type { RestaurantBlockedDate, RestaurantWorkingHour } from '@/types/restaurant';

export const DEFAULT_DELIVERY_RADIUS_KM = 10;
export const MAX_DELIVERY_RADIUS_KM = 15;
export const CHECKOUT_CUTOFF_BEFORE_CLOSE_MINUTES = 60;

export const normalizeDeliveryRadiusKm = (value: unknown) => {
  const radius = Number(value);

  if (!Number.isFinite(radius) || radius <= 0) {
    return DEFAULT_DELIVERY_RADIUS_KM;
  }

  return Math.min(MAX_DELIVERY_RADIUS_KM, Math.max(1, radius));
};

const getDayName = (date: Date) => formatWeekdayKey(date);

const dayLabel = (date: Date, baseDate: Date) => {
  if (isSameLocalDate(date, baseDate)) return 'today';

  const tomorrow = new Date(baseDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isSameLocalDate(date, tomorrow)) return 'tomorrow';

  return formatWeekdayName(date);
};

const isSameLocalDate = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const isBlockedOnDate = (blockedDates: RestaurantBlockedDate[] = [], targetDate: Date) =>
  blockedDates.some((blockedDate) => {
    const date = new Date(blockedDate.date);
    return !Number.isNaN(date.getTime()) && isSameLocalDate(date, targetDate);
  });

const parseTimeForDate = (time: string, targetDate: Date) => {
  const [hour, minute] = time.split(':').map(Number);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }

  const date = new Date(targetDate);
  date.setHours(hour, minute, 0, 0);
  return date;
};

const getTodayWorkingHoursWindow = (
  workingHours: RestaurantWorkingHour[] = [],
  blockedDates: RestaurantBlockedDate[] = [],
  targetDate = new Date()
) => {
  if (isBlockedOnDate(blockedDates, targetDate)) {
    return null;
  }

  const todayHours = workingHours.find((hours) => hours.day === getDayName(targetDate));
  if (!todayHours || todayHours.isClosed) {
    return null;
  }

  const openTime = parseTimeForDate(todayHours.openTime, targetDate);
  const closeTime = parseTimeForDate(todayHours.closeTime, targetDate);

  if (!openTime || !closeTime) {
    return null;
  }

  return { hours: todayHours, openTime, closeTime };
};

export const getNextOpeningSummary = (
  workingHours: RestaurantWorkingHour[] = [],
  blockedDates: RestaurantBlockedDate[] = [],
  targetDate = new Date()
) => {
  for (let dayOffset = 0; dayOffset < 8; dayOffset += 1) {
    const candidateDate = new Date(targetDate);
    candidateDate.setDate(candidateDate.getDate() + dayOffset);

    if (isBlockedOnDate(blockedDates, candidateDate)) {
      continue;
    }

    const hours = workingHours.find((item) => item.day === getDayName(candidateDate));
    if (!hours || hours.isClosed) {
      continue;
    }

    const openTime = parseTimeForDate(hours.openTime, candidateDate);
    const closeTime = parseTimeForDate(hours.closeTime, candidateDate);

    if (!openTime || !closeTime) {
      continue;
    }

    if (dayOffset === 0 && targetDate > closeTime) {
      continue;
    }

    if (dayOffset === 0 && targetDate >= openTime && targetDate <= closeTime) {
      return null;
    }

    return `This restaurant opens ${dayLabel(candidateDate, targetDate)} at ${hours.openTime}.`;
  }

  return 'This restaurant is not accepting orders during the listed working hours.';
};

export const isRestaurantOpen = (
  workingHours: RestaurantWorkingHour[] = [],
  blockedDates: RestaurantBlockedDate[] = [],
  targetDate = new Date()
) => {
  const workingHoursWindow = getTodayWorkingHoursWindow(workingHours, blockedDates, targetDate);

  return Boolean(
    workingHoursWindow &&
    targetDate >= workingHoursWindow.openTime &&
    targetDate <= workingHoursWindow.closeTime
  );
};

export const getClosingSoonCheckoutMessage = (
  workingHours: RestaurantWorkingHour[] = [],
  blockedDates: RestaurantBlockedDate[] = [],
  targetDate = new Date()
) => {
  const workingHoursWindow = getTodayWorkingHoursWindow(workingHours, blockedDates, targetDate);

  if (
    !workingHoursWindow ||
    targetDate < workingHoursWindow.openTime ||
    targetDate > workingHoursWindow.closeTime
  ) {
    return null;
  }

  const checkoutCutoffTime = new Date(workingHoursWindow.closeTime);
  checkoutCutoffTime.setMinutes(
    checkoutCutoffTime.getMinutes() - CHECKOUT_CUTOFF_BEFORE_CLOSE_MINUTES
  );

  if (targetDate <= checkoutCutoffTime) {
    return null;
  }

  return `This restaurant closes soon. Orders must be placed at least ${CHECKOUT_CUTOFF_BEFORE_CLOSE_MINUTES} minutes before closing. Please try again during the next opening window.`;
};

export const isValidCoordinate = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return false;
  }

  const coordinate = Number(value);
  return Number.isFinite(coordinate);
};

export const hasCoordinatePair = (latitude: unknown, longitude: unknown) =>
  isValidCoordinate(latitude) && isValidCoordinate(longitude);

export const calculateDistanceKm = (
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number
) => {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latDelta = toRadians(toLatitude - fromLatitude);
  const lonDelta = toRadians(toLongitude - fromLongitude);
  const originLat = toRadians(fromLatitude);
  const destinationLat = toRadians(toLatitude);

  const haversine =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.sin(lonDelta / 2) *
      Math.sin(lonDelta / 2) *
      Math.cos(originLat) *
      Math.cos(destinationLat);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

export const getRestaurantOrderingStatus = ({
  restaurant,
  deliveryLatitude,
  deliveryLongitude,
  now = new Date(),
}: {
  restaurant: any;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  now?: Date;
}) => {
  const deliveryRadiusKm = normalizeDeliveryRadiusKm(restaurant?.deliveryRadiusKm);
  const isOpen = isRestaurantOpen(
    Array.isArray(restaurant?.workingHours) ? restaurant.workingHours : [],
    Array.isArray(restaurant?.blockedDates) ? restaurant.blockedDates : [],
    now
  );
  const isPaused = Boolean(restaurant?.isPaused);
  const closingSoonMessage = getClosingSoonCheckoutMessage(
    Array.isArray(restaurant?.workingHours) ? restaurant.workingHours : [],
    Array.isArray(restaurant?.blockedDates) ? restaurant.blockedDates : [],
    now
  );
  const pauseReason =
    typeof restaurant?.pauseReason === 'string' ? restaurant.pauseReason.trim() : '';
  const hasRestaurantLocation = hasCoordinatePair(restaurant?.latitude, restaurant?.longitude);
  const hasDeliveryLocation = hasCoordinatePair(deliveryLatitude, deliveryLongitude);
  const distanceKm =
    hasRestaurantLocation && hasDeliveryLocation
      ? calculateDistanceKm(
          Number(restaurant.latitude),
          Number(restaurant.longitude),
          Number(deliveryLatitude),
          Number(deliveryLongitude)
        )
      : null;
  const isWithinDeliveryRadius = distanceKm === null ? null : distanceKm <= deliveryRadiusKm;

  let reason: string | null = null;

  if (isPaused) {
    reason =
      pauseReason || 'This restaurant paused new orders for a little while. Please try again soon.';
  } else if (!isOpen) {
    reason =
      getNextOpeningSummary(
        Array.isArray(restaurant?.workingHours) ? restaurant.workingHours : [],
        Array.isArray(restaurant?.blockedDates) ? restaurant.blockedDates : [],
        now
      ) || 'This restaurant is not working at the moment. Please try again during open hours.';
  } else if (closingSoonMessage) {
    reason = closingSoonMessage;
  } else if (isWithinDeliveryRadius === false) {
    reason = `This restaurant delivers within ${deliveryRadiusKm} km. Your location is ${distanceKm?.toFixed(
      1
    )} km away.`;
  }

  return {
    isOpen,
    isPaused,
    isClosingSoonForCheckout: Boolean(closingSoonMessage),
    isAcceptingOrders: !reason,
    pauseReason,
    reason,
    deliveryRadiusKm,
    distanceKm,
    isWithinDeliveryRadius,
    requiresDeliveryLocation: isOpen && !isPaused && hasRestaurantLocation && !hasDeliveryLocation,
  };
};
