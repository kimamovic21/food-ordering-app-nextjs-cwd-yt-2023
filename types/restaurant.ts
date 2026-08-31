import type { EntityId, ISODateString } from '@/types/common';

export type WeekdayKey =
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type RestaurantWorkingHour = {
  day: WeekdayKey | string;
  openTime: string;
  closeTime: string;
  isClosed?: boolean;
};

export type RestaurantBlockedDate = {
  date: string | Date;
  reason?: string;
};

export type RestaurantListItem = {
  _id: EntityId;
  name: string;
  city: string;
  country: string;
  street: string;
  description: string;
  image: string | null;
  isOpen: boolean;
  distanceKm: number | null;
  averageRating: number;
  ratingCount: number;
};

export type RestaurantSummary = {
  _id: EntityId;
  name: string;
};

export type RestaurantDetails = RestaurantSummary & {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  contact: string;
  email: string;
  webAddress?: string;
  description: string;
  images: string[];
  tax: number;
  courierFee: number;
  totalEmployees: number;
  workingHours: RestaurantWorkingHour[];
  blockedDates: RestaurantBlockedDate[];
  isOpen: boolean;
  isAcceptingOrders?: boolean;
  orderingUnavailableReason?: string | null;
  isBusy?: boolean;
  averageRating: number;
  ratingCount: number;
};

export type RestaurantPublicDetails = Partial<RestaurantDetails> &
  Pick<RestaurantDetails, '_id' | 'name'>;

export type RestaurantFormData = {
  _id?: EntityId;
  name: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  contact: string;
  email: string;
  webAddress: string;
  description: string;
  tax: number;
  courierFee: number;
  minimumOrderAmount: number;
  averagePreparationMinutes: number;
  averageDeliveryMinutes: number;
  activeOrderLimit: number;
  deliveryRadiusKm: number;
  isPaused: boolean;
  pauseReason: string;
  workingHours: RestaurantWorkingHour[];
  blockedDates: RestaurantBlockedDate[];
  totalEmployees: number;
  images: string[];
};

export type RestaurantAdminDetails = RestaurantFormData & {
  _id: EntityId;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
};
