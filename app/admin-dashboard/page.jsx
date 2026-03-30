'use client';

import { ArrowRight, Lightbulb, Package, ShoppingCart, Utensils } from 'lucide-react';
import Link from 'next/link';

const shortcuts = [
  {
    title: 'Restaurant Management',
    description: 'Update your restaurant profile, opening hours, and contact details.',
    href: '/admin-dashboard/restaurant',
    icon: Utensils,
    color: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  {
    title: 'Menu Items',
    description: 'Add, edit, and organize products visible to your customers.',
    href: '/admin-dashboard/menu-items',
    icon: Package,
    color: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  {
    title: 'Orders',
    description: 'Track incoming orders and keep delivery flow moving smoothly.',
    href: '/admin-dashboard/orders',
    icon: ShoppingCart,
    color: 'bg-primary/10',
    iconColor: 'text-primary',
  },
];

const AdminDashboard = () => {
  return (
    <div className='space-y-8'>
      {/* Hero Section */}
      <section className='rounded-2xl bg-linear-to-br from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700 p-8 md:p-12 text-white shadow-lg'>
        <div className='max-w-2xl'>
          <p className='text-sm font-semibold uppercase tracking-widest text-amber-100'>
            Welcome Back
          </p>
          <h1 className='mt-3 text-3xl md:text-4xl lg:text-5xl font-bold'>
            This is your admin panel
          </h1>
          <p className='mt-4 text-base md:text-lg text-amber-50 max-w-2xl leading-relaxed'>
            Manage your restaurant operations from one place: menu, orders, team, and performance.
            Start from the left sidebar or use one of the quick shortcuts below.
          </p>
        </div>
      </section>

      {/* Quick Shortcuts */}
      <section>
        <h2 className='text-lg font-semibold mb-4 text-foreground'>Quick Shortcuts</h2>
        <div className='grid gap-4 md:grid-cols-3'>
          {shortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className='group rounded-xl border border-border bg-card hover:shadow-lg transition-all duration-300 overflow-hidden'
              >
                <div className='p-6'>
                  {/* Icon Background */}
                  <div
                    className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className={`w-6 h-6 ${item.iconColor}`} />
                  </div>

                  <h3 className='text-base font-semibold text-foreground'>{item.title}</h3>
                  <p className='mt-2 text-sm text-muted-foreground'>{item.description}</p>

                  {/* Action */}
                  <div className='mt-4 flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all'>
                    <span>Open section</span>
                    <ArrowRight className='w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity' />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Help Section */}
      <section className='rounded-xl border border-border bg-card p-6 shadow-sm'>
        <div className='flex gap-4'>
          <div className='shrink-0'>
            <Lightbulb className='w-6 h-6 text-primary mt-1' />
          </div>
          <div>
            <h3 className='font-semibold text-foreground'>Need help while building?</h3>
            <p className='mt-2 text-sm text-muted-foreground'>
              You can keep iterating this dashboard page by page. Start simple, then style each
              module as your admin workflow grows. Check the sidebar for all available sections.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
