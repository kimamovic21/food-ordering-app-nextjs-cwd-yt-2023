import { formatWeekdayKey, formatWeekdayName } from '@/libs/dateFormat';

export type RestaurantWorkingHour = {
  day: string;
  openTime: string;
  closeTime: string;
  isClosed?: boolean;
};

export type RestaurantBlockedDate = {
  date: string | Date;
  reason?: string;
};

export const DEFAULT_DELIVERY_RADIUS_KM = 10;
export const MAX_DELIVERY_RADIUS_KM = 15;

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
  const blockedToday = isBlockedOnDate(blockedDates, targetDate);

  if (blockedToday) {
    return false;
  }

  const todayHours = workingHours.find((hours) => hours.day === getDayName(targetDate));
  if (!todayHours || todayHours.isClosed) {
    return false;
  }

  const [openHour, openMinute] = todayHours.openTime.split(':').map(Number);
  const [closeHour, closeMinute] = todayHours.closeTime.split(':').map(Number);

  if (
    !Number.isFinite(openHour) ||
    !Number.isFinite(openMinute) ||
    !Number.isFinite(closeHour) ||
    !Number.isFinite(closeMinute)
  ) {
    return false;
  }

  const openTime = new Date(targetDate);
  openTime.setHours(openHour, openMinute, 0, 0);

  const closeTime = new Date(targetDate);
  closeTime.setHours(closeHour, closeMinute, 0, 0);

  return targetDate >= openTime && targetDate <= closeTime;
};

export const isValidCoordinate = (value: unknown) => {
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
  } else if (isWithinDeliveryRadius === false) {
    reason = `This restaurant delivers within ${deliveryRadiusKm} km. Your location is ${distanceKm?.toFixed(
      1
    )} km away.`;
  }

  return {
    isOpen,
    isPaused,
    isAcceptingOrders: !reason,
    pauseReason,
    reason,
    deliveryRadiusKm,
    distanceKm,
    isWithinDeliveryRadius,
    requiresDeliveryLocation: isOpen && !isPaused && hasRestaurantLocation && !hasDeliveryLocation,
  };
};
