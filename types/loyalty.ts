export type LoyaltyTier = {
  name: string;
  ordersRequired: number;
  discountPercentage: number;
  color: string;
};

export type LoyaltyStatus = {
  currentTier: LoyaltyTier | null;
  nextTier: LoyaltyTier | null;
  totalOrders: number;
  ordersToNextTier: number;
  discountPercentage: number;
};
