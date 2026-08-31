import type { EntityId } from '@/types/common';

export type CouponDiscountType = 'percentage';

export type CouponLike = {
  _id?: EntityId;
  code: string;
  title?: string;
  description?: string;
  discountType?: CouponDiscountType;
  discountValue: number;
  minimumOrderAmount?: number;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  usagePerCustomer?: number | null;
  usageCount?: number;
  firstOrderOnly?: boolean;
  isActive?: boolean;
  startsAt?: string | Date | null;
  expiresAt?: string | Date | null;
  restaurantId?: EntityId;
};

export type AdminCoupon = CouponLike & {
  _id: EntityId;
  title: string;
  description: string;
  minimumOrderAmount: number;
  maxDiscountAmount?: number | null;
  usageLimit: number | null;
  usagePerCustomer?: number;
  usageCount?: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  isPublic?: boolean;
  firstOrderOnly: boolean;
  terms?: string;
  tags?: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CouponFormSubmitValues = {
  code: string;
  title: string;
  description: string;
  discountValue: number;
  minimumOrderAmount: number;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usagePerCustomer: number;
  startsAt: string;
  expiresAt: string | null;
  isActive: boolean;
  isPublic: boolean;
  firstOrderOnly: boolean;
  terms: string;
  tags: string[];
};

export type CouponFormInitialValues = Partial<
  Omit<CouponFormSubmitValues, 'startsAt' | 'expiresAt'> & {
    startsAt: string | null;
    expiresAt: string | null;
  }
>;
