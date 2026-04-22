import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/libs/authOptions';
import { Order } from '@/models/order';
import { User } from '@/models/user';
import { LOYALTY_TIERS, calculateLoyaltyStatus } from '@/libs/loyaltyCalculator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Gift, ShoppingBag, TrendingUp } from 'lucide-react';

export default async function LoyaltyPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return redirect('/login');
  }

  // Find user by email and count completed orders
  const user = await User.findOne({ email: session.user.email });

  if (!user) {
    return redirect('/login');
  }

  // Count completed orders for the user
  const completedOrderCount = await Order.countDocuments({
    userId: user._id,
    orderStatus: 'completed',
  });

  const loyaltyStatus = calculateLoyaltyStatus(completedOrderCount);

  return (
    <section className='max-w-4xl mx-auto px-4 py-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold mb-2 flex items-center gap-2'>
          <Trophy className='h-8 w-8 text-yellow-500' />
          Loyalty Rewards
        </h1>
        <p className='text-muted-foreground'>
          Earn exclusive discounts based on your order history
        </p>
      </div>

      {/* Current Status Card */}
      <Card className='mb-6 border-2'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Gift className='h-5 w-5' />
            Your Current Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground mb-1'>Current Tier</p>
                {loyaltyStatus.currentTier ? (
                  <Badge className='text-lg px-4 py-1'>
                    <span className='text-white font-semibold'>
                      {loyaltyStatus.currentTier.name}
                    </span>
                  </Badge>
                ) : (
                  <p className='text-sm'>No tier yet - Complete your first order!</p>
                )}
              </div>
              <div className='text-right'>
                <p className='text-sm text-muted-foreground mb-1'>Discount</p>
                <p className='text-3xl font-bold text-green-600'>
                  {loyaltyStatus.discountPercentage}%
                </p>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <ShoppingBag className='h-4 w-4 text-muted-foreground' />
              <p className='text-sm'>
                <span className='font-semibold'>{loyaltyStatus.totalOrders}</span> completed orders
              </p>
            </div>

            {loyaltyStatus.nextTier && (
              <div className='mt-4 p-4 bg-muted rounded-lg'>
                <div className='flex items-center gap-2 mb-2'>
                  <TrendingUp className='h-4 w-4' />
                  <p className='text-sm font-semibold'>Next Tier Progress</p>
                </div>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span>{loyaltyStatus.nextTier.name} Tier</span>
                    <span className='text-muted-foreground'>
                      {loyaltyStatus.ordersToNextTier} orders to go
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2.5'>
                    <div
                      className='bg-blue-600 h-2.5 rounded-full transition-all'
                      style={{
                        width: `${(loyaltyStatus.totalOrders / loyaltyStatus.nextTier.ordersRequired) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Unlock {loyaltyStatus.nextTier.discountPercentage}% discount at{' '}
                    {loyaltyStatus.nextTier.ordersRequired} orders
                  </p>
                </div>
              </div>
            )}

            {!loyaltyStatus.nextTier && loyaltyStatus.currentTier && (
              <div className='mt-4 p-4 bg-linear-to-r from-purple-500/10 to-pink-500/10 rounded-lg border-2 border-purple-300'>
                <p className='text-center font-semibold text-purple-700'>
                  🎉 Congratulations! You&apos;ve reached the highest tier! 🎉
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* All Tiers */}
      <Card>
        <CardHeader>
          <CardTitle>All Loyalty Tiers</CardTitle>
          <CardDescription>Complete more orders to unlock higher discounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {LOYALTY_TIERS.map((tier) => {
              const isUnlocked = completedOrderCount >= tier.ordersRequired;
              const isCurrent = loyaltyStatus.currentTier?.name === tier.name;

              return (
                <div
                  key={tier.name}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                      : isUnlocked
                        ? 'border-green-300 bg-green-50 dark:bg-green-950/20'
                        : 'border-gray-200 bg-gray-50 dark:bg-gray-900/20'
                  }`}
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <div className={`text-2xl ${tier.color}`}>{isUnlocked ? '✓' : '🔒'}</div>
                      <div>
                        <h3 className={`font-semibold ${tier.color}`}>
                          {tier.name} Tier
                          {isCurrent && (
                            <Badge variant='outline' className='ml-2'>
                              Current
                            </Badge>
                          )}
                        </h3>
                        <p className='text-sm text-muted-foreground'>
                          {tier.ordersRequired} {tier.ordersRequired === 1 ? 'order' : 'orders'}{' '}
                          required
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='text-2xl font-bold text-green-600'>
                        {tier.discountPercentage}%
                      </p>
                      <p className='text-xs text-muted-foreground'>discount</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className='mt-6 p-4 bg-muted rounded-lg'>
        <h3 className='font-semibold mb-2'>How it works</h3>
        <ul className='space-y-1 text-sm text-muted-foreground'>
          <li>• Complete orders to earn loyalty discounts</li>
          <li>• Discounts are automatically applied to delivery fees at checkout</li>
          <li>• Only completed and paid orders count towards your tier</li>
          <li>• Discount applies to your delivery fee only (food prices unchanged)</li>
        </ul>
      </div>
    </section>
  );
}
