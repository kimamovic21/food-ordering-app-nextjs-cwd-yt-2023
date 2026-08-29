/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import OrderSummary from '@/app/cart/OrderSummary';

const defaultProps = {
  subtotal: 25,
  includedTax: 4.25,
  taxPercentage: 17,
  deliveryFee: 5,
  loyaltyDiscountPercentage: 0,
  loyaltyDiscount: 0,
  couponCode: '',
  couponDiscount: 0,
  couponMessage: null,
  couponError: null,
  isApplyingCoupon: false,
  onCouponCodeChange: vi.fn(),
  onApplyCoupon: vi.fn(),
  isLoggedIn: true,
  isSubmitting: false,
  handleCheckout: vi.fn(),
  restaurantsOpen: false,
  restaurantAcceptingCheckout: true,
  restaurantBusy: false,
  restaurantPaused: false,
  belowMinimumOrderAmount: false,
  minimumOrderAmount: 10,
  missingDeliveryLocation: false,
  loadingRestaurants: false,
  hasUnavailableItems: false,
  loadingMenuAvailability: false,
};

describe('OrderSummary', () => {
  it('shows restaurant checking state before closed state', () => {
    render(<OrderSummary {...defaultProps} loadingRestaurants />);

    expect(screen.getByText('Checking restaurant status...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Checking Restaurant' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Restaurant Closed' })).not.toBeInTheDocument();
  });
});
