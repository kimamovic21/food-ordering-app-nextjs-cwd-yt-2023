import type { EntityId, ISODateString } from '@/types/common';
import type { RestaurantSummary } from '@/types/restaurant';

export type ReviewCardData = {
  _id: EntityId;
  rating: number;
  reviewText: string;
  createdAt: ISODateString;
  restaurant?: RestaurantSummary | null;
  user?: {
    name: string;
  } | null;
};

export type ReviewsResponse = {
  reviews: ReviewCardData[];
  meta: {
    totalCount: number;
    search: string;
    rating: number | null;
  };
};

export type RestaurantReviewsResponse = {
  restaurant: RestaurantSummary;
  reviews: ReviewCardData[];
  meta: {
    totalCount: number;
    offset: number;
    limit: number;
    nextOffset: number;
    hasMore: boolean;
  };
};

export type CourierReviewData = {
  _id: EntityId;
  rating: number;
  reviewText: string;
  createdAt: ISODateString;
  orderId: EntityId;
  customer?: {
    _id?: EntityId;
    name?: string;
  } | null;
};

export type CourierReviewsResponse = {
  reviews: CourierReviewData[];
  meta: {
    totalCount: number;
    search: string;
    rating: number | null;
  };
  summary: {
    averageRating: number;
    totalCount: number;
  };
};

export type CourierReviewsDisplayResponse = {
  courier: {
    _id: EntityId;
    name: string;
    image?: string | null;
  };
  reviews: Array<
    Omit<CourierReviewData, 'orderId' | 'customer'> & {
      customer?: {
        name?: string;
      } | null;
    }
  >;
  summary: {
    averageRating: number;
    totalCount: number;
  };
};
