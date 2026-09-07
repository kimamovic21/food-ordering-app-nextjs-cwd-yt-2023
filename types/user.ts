export type UserRole = 'user' | 'admin' | 'courier';

export interface UserSummary {
  _id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: UserRole | string | null;
}

export interface DeliveryAddress {
  _id: string;
  label: string;
  phone: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  country: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type DeliveryAddressInput = Omit<DeliveryAddress, '_id' | 'createdAt' | 'updatedAt'>;

export interface ExtendedUser {
  _id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  provider?: string | null;
  phone?: string | null;
  streetAddress?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  role?: UserRole | string | null;
  availability?: boolean;
  loyaltyTier?: string | null;
  restaurantId?: string | null;
  deliveryAddresses?: DeliveryAddress[];
}

export type ProfileData = ExtendedUser;

export type AdminUserListItem = UserSummary & {
  image?: string | null;
  city?: string;
  country?: string;
  phone?: string;
  postalCode?: string;
  streetAddress?: string;
  emailVerified?: string | null;
  updatedAt?: string;
  admin?: boolean;
};

export type ProfileUpdateData = Pick<
  ExtendedUser,
  'name' | 'phone' | 'streetAddress' | 'postalCode' | 'city' | 'country'
>;
