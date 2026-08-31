import type { EntityId, ISODateString } from '@/types/common';

export type ReceiptItem = {
  name: string;
  size: string;
  quantity: number;
  price: number;
  image?: string | null;
  lineTotal?: number;
};

export type ReceiptRestaurant = {
  _id?: EntityId;
  name: string;
  contact?: string | null;
  email?: string | null;
  street?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

export type ReceiptOrder = {
  _id: EntityId;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
  taxAmount?: number;
  deliveryFee?: number;
  couponCode?: string | null;
  couponDiscountAmount?: number;
  couponDiscountPercentage?: number;
  specialInstructions?: string | null;
  total?: number;
};

export type ReceiptResponse = {
  order: ReceiptOrder;
  receiptItems: ReceiptItem[];
  restaurant?: ReceiptRestaurant | null;
};

export type PurchaseReceiptProps = {
  orderId: EntityId;
  customerEmail: string;
  purchasedOn?: Date | string | null;
  restaurant?: ReceiptRestaurant | null;
  items: ReceiptItem[];
  taxAmount: number;
  deliveryFee: number;
  couponCode?: string | null;
  couponDiscountAmount?: number;
  couponDiscountPercentage?: number;
  specialInstructions?: string | null;
  total: number;
};
