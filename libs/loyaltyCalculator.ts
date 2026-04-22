export interface LoyaltyTier {
  name: string;
  ordersRequired: number;
  discountPercentage: number;
  color: string;
}

export const LOYALTY_TIERS: LoyaltyTier[] = [
  { name: 'Bronze', ordersRequired: 1, discountPercentage: 10, color: 'text-orange-600' },
  { name: 'Silver', ordersRequired: 5, discountPercentage: 20, color: 'text-gray-400' },
  { name: 'Gold', ordersRequired: 10, discountPercentage: 30, color: 'text-yellow-500' },
  { name: 'Platinum', ordersRequired: 20, discountPercentage: 40, color: 'text-blue-400' },
  { name: 'Diamond', ordersRequired: 30, discountPercentage: 50, color: 'text-purple-500' },
];

export interface LoyaltyStatus {
  currentTier: LoyaltyTier | null;
  nextTier: LoyaltyTier | null;
  totalOrders: number;
  ordersToNextTier: number;
  discountPercentage: number;
}

/**
 * Calculate user's loyalty status based on completed order count
 */
export function calculateLoyaltyStatus(completedOrderCount: number): LoyaltyStatus {
  let currentTier: LoyaltyTier | null = null;
  let nextTier: LoyaltyTier | null = LOYALTY_TIERS[0];

  // Find current tier
  for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
    if (completedOrderCount >= LOYALTY_TIERS[i].ordersRequired) {
      currentTier = LOYALTY_TIERS[i];
      nextTier = i < LOYALTY_TIERS.length - 1 ? LOYALTY_TIERS[i + 1] : null;
      break;
    }
  }

  const ordersToNextTier = nextTier ? nextTier.ordersRequired - completedOrderCount : 0;

  return {
    currentTier,
    nextTier,
    totalOrders: completedOrderCount,
    ordersToNextTier,
    discountPercentage: currentTier?.discountPercentage || 0,
  };
}

/**
 * Calculate loyalty discount amount based on the food subtotal and loyalty percentage.
 */
export function calculateLoyaltyDiscount(subtotal: number, discountPercentage: number): number {
  return Math.round(((subtotal * discountPercentage) / 100) * 100) / 100;
}

/**
 * Get loyalty tier badge styling
 */
export function getTierBadgeColor(tierName: string | undefined): string {
  const tier = LOYALTY_TIERS.find((t) => t.name === tierName);
  return tier?.color || 'text-gray-500';
}
