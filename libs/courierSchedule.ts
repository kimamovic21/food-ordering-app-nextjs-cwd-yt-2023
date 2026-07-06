export type CourierWorkingHour = {
  day: string;
  startTime: string;
  endTime: string;
  isUnavailable?: boolean;
};

export const defaultCourierWorkingHours: CourierWorkingHour[] = [
  { day: 'monday', startTime: '09:00', endTime: '17:00', isUnavailable: false },
  { day: 'tuesday', startTime: '09:00', endTime: '17:00', isUnavailable: false },
  { day: 'wednesday', startTime: '09:00', endTime: '17:00', isUnavailable: false },
  { day: 'thursday', startTime: '09:00', endTime: '17:00', isUnavailable: false },
  { day: 'friday', startTime: '09:00', endTime: '17:00', isUnavailable: false },
  { day: 'saturday', startTime: '10:00', endTime: '16:00', isUnavailable: true },
  { day: 'sunday', startTime: '10:00', endTime: '16:00', isUnavailable: true },
];

const validDays = new Set(defaultCourierWorkingHours.map((item) => item.day));
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

const getDayName = (date: Date) =>
  ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];

export const normalizeCourierWorkingHours = (workingHours: unknown): CourierWorkingHour[] => {
  const incoming = Array.isArray(workingHours) ? workingHours : [];

  return defaultCourierWorkingHours.map((defaultHours) => {
    const match = incoming.find((item: any) => item?.day === defaultHours.day);
    const startTime =
      typeof match?.startTime === 'string' && timePattern.test(match.startTime)
        ? match.startTime
        : defaultHours.startTime;
    const endTime =
      typeof match?.endTime === 'string' && timePattern.test(match.endTime)
        ? match.endTime
        : defaultHours.endTime;

    return {
      day: defaultHours.day,
      startTime,
      endTime,
      isUnavailable: Boolean(match?.isUnavailable),
    };
  });
};

export const validateCourierWorkingHours = (workingHours: unknown) => {
  if (!Array.isArray(workingHours)) {
    return 'Courier schedule must be an array.';
  }

  for (const item of workingHours as CourierWorkingHour[]) {
    if (!validDays.has(item?.day)) {
      return 'Courier schedule contains an invalid day.';
    }

    if (!timePattern.test(String(item?.startTime || ''))) {
      return 'Courier schedule contains an invalid start time.';
    }

    if (!timePattern.test(String(item?.endTime || ''))) {
      return 'Courier schedule contains an invalid end time.';
    }

    if (!item?.isUnavailable && toMinutes(item.startTime) >= toMinutes(item.endTime)) {
      return 'Courier schedule start time must be before end time.';
    }
  }

  return null;
};

export const isCourierScheduledNow = (workingHours: unknown, targetDate: Date = new Date()) => {
  const normalizedHours = normalizeCourierWorkingHours(workingHours);
  const todayHours = normalizedHours.find((item) => item.day === getDayName(targetDate));

  if (!todayHours || todayHours.isUnavailable) {
    return false;
  }

  const currentMinutes = targetDate.getHours() * 60 + targetDate.getMinutes();
  return (
    currentMinutes >= toMinutes(todayHours.startTime) &&
    currentMinutes <= toMinutes(todayHours.endTime)
  );
};
