'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { Command } from 'cmdk';
import {
  Bell,
  ClipboardList,
  Heart,
  Home,
  LayoutDashboard,
  LifeBuoy,
  LogIn,
  MessageSquareText,
  PieChart,
  Radar,
  ReceiptText,
  Search,
  ShoppingCart,
  Star,
  TicketPercent,
  Truck,
  Utensils,
  X,
} from 'lucide-react';
import useProfile from '@/hooks/useProfile';
import { APP_COMMAND_PALETTE_OPEN_EVENT } from '@/libs/commandPalette';

type AppCommand = {
  href: string;
  label: string;
  description: string;
  group: 'Explore' | 'Account' | 'Customer' | 'Admin' | 'Courier';
  keywords: string[];
  icon: ComponentType<{ className?: string }>;
};

const baseCommands: AppCommand[] = [
  {
    href: '/',
    label: 'Home',
    description: 'Open the landing page',
    group: 'Explore',
    keywords: ['start', 'landing'],
    icon: Home,
  },
  {
    href: '/menu',
    label: 'Menu',
    description: 'Browse menu items',
    group: 'Explore',
    keywords: ['food', 'pizza', 'items'],
    icon: Utensils,
  },
  {
    href: '/restaurants',
    label: 'Restaurants',
    description: 'Browse restaurants',
    group: 'Explore',
    keywords: ['restaurant', 'places'],
    icon: Search,
  },
  {
    href: '/cart',
    label: 'Cart',
    description: 'Review cart and checkout',
    group: 'Explore',
    keywords: ['checkout', 'basket'],
    icon: ShoppingCart,
  },
];

const signedInCommands: AppCommand[] = [
  {
    href: '/profile',
    label: 'Profile',
    description: 'Edit account and delivery details',
    group: 'Account',
    keywords: ['account', 'settings'],
    icon: LayoutDashboard,
  },
  {
    href: '/messages',
    label: 'Messages',
    description: 'Open approved conversations',
    group: 'Account',
    keywords: ['chat', 'inbox'],
    icon: MessageSquareText,
  },
  {
    href: '/notifications',
    label: 'Notifications',
    description: 'Open notification center',
    group: 'Account',
    keywords: ['alerts', 'bell'],
    icon: Bell,
  },
  {
    href: '/my-orders',
    label: 'My orders',
    description: 'Track and review orders',
    group: 'Customer',
    keywords: ['orders', 'history'],
    icon: ReceiptText,
  },
  {
    href: '/favorite-meals',
    label: 'Favorite meals',
    description: 'Open saved menu items',
    group: 'Customer',
    keywords: ['favorites', 'meals'],
    icon: Heart,
  },
  {
    href: '/favorite-restaurants',
    label: 'Favorite restaurants',
    description: 'Open saved restaurants',
    group: 'Customer',
    keywords: ['favorites', 'restaurants'],
    icon: Heart,
  },
  {
    href: '/reviews',
    label: 'Reviews',
    description: 'Manage restaurant reviews',
    group: 'Customer',
    keywords: ['ratings', 'feedback'],
    icon: Star,
  },
  {
    href: '/my-reports',
    label: 'My reports',
    description: 'View reported problems',
    group: 'Customer',
    keywords: ['support', 'tickets'],
    icon: LifeBuoy,
  },
];

const adminCommands: AppCommand[] = [
  {
    href: '/admin-dashboard',
    label: 'Admin dashboard',
    description: 'Open admin overview',
    group: 'Admin',
    keywords: ['admin', 'dashboard'],
    icon: LayoutDashboard,
  },
  {
    href: '/admin-dashboard/orders',
    label: 'Admin orders',
    description: 'Manage restaurant orders',
    group: 'Admin',
    keywords: ['orders', 'restaurant'],
    icon: ReceiptText,
  },
  {
    href: '/admin-dashboard/operations',
    label: 'Restaurant operations',
    description: 'Open today status, capacity, courier, and attention overview',
    group: 'Admin',
    keywords: ['operations', 'capacity', 'couriers', 'busy', 'late'],
    icon: Radar,
  },
  {
    href: '/admin-dashboard/order-queue',
    label: 'Order queue',
    description: 'Monitor active order lifecycle',
    group: 'Admin',
    keywords: ['queue', 'late', 'operations'],
    icon: ClipboardList,
  },
  {
    href: '/admin-dashboard/menu-items',
    label: 'Menu items',
    description: 'Manage restaurant menu items',
    group: 'Admin',
    keywords: ['food', 'availability'],
    icon: Utensils,
  },
  {
    href: '/admin-dashboard/restaurant',
    label: 'Restaurant settings',
    description: 'Manage restaurant profile',
    group: 'Admin',
    keywords: ['hours', 'busy', 'capacity'],
    icon: Utensils,
  },
  {
    href: '/admin-dashboard/restaurant-reports',
    label: 'Restaurant reports',
    description: 'Open daily, weekly, and monthly reports',
    group: 'Admin',
    keywords: ['reports', 'pdf', 'revenue'],
    icon: PieChart,
  },
  {
    href: '/admin-dashboard/support-tickets',
    label: 'Support tickets',
    description: 'Review reported problems',
    group: 'Admin',
    keywords: ['support', 'reports', 'issues'],
    icon: LifeBuoy,
  },
  {
    href: '/admin-dashboard/coupons',
    label: 'Coupons',
    description: 'Manage restaurant coupons',
    group: 'Admin',
    keywords: ['discounts', 'promo'],
    icon: TicketPercent,
  },
  {
    href: '/admin-dashboard/statistics',
    label: 'Statistics',
    description: 'Open platform statistics',
    group: 'Admin',
    keywords: ['stats', 'charts'],
    icon: PieChart,
  },
];

const courierCommands: AppCommand[] = [
  {
    href: '/courier-dashboard',
    label: 'Courier dashboard',
    description: 'Open courier overview',
    group: 'Courier',
    keywords: ['delivery', 'courier'],
    icon: Truck,
  },
  {
    href: '/courier-dashboard/my-delivery',
    label: 'Active delivery',
    description: 'Open current delivery task',
    group: 'Courier',
    keywords: ['active', 'pin', 'handoff'],
    icon: Truck,
  },
  {
    href: '/courier-dashboard/my-deliveries',
    label: 'Delivery history',
    description: 'Review completed deliveries',
    group: 'Courier',
    keywords: ['history', 'completed'],
    icon: ClipboardList,
  },
  {
    href: '/courier-dashboard/earnings',
    label: 'Earnings',
    description: 'Open courier earnings',
    group: 'Courier',
    keywords: ['money', 'delivery fee'],
    icon: ReceiptText,
  },
];

const guestCommands: AppCommand[] = [
  {
    href: '/login',
    label: 'Login',
    description: 'Sign in to your account',
    group: 'Account',
    keywords: ['signin', 'account'],
    icon: LogIn,
  },
  {
    href: '/register',
    label: 'Register',
    description: 'Create a new account',
    group: 'Account',
    keywords: ['signup', 'account'],
    icon: LogIn,
  },
];

const groupOrder: AppCommand['group'][] = ['Explore', 'Account', 'Customer', 'Admin', 'Courier'];

const AppCommandPalette = () => {
  const router = useRouter();
  const session = useSession();
  const { data: profileData } = useProfile();
  const [open, setOpen] = useState(false);

  const commands = useMemo(() => {
    const isAuthenticated = session.status === 'authenticated';
    const isAdmin = profileData?.role === 'admin' || (session.data?.user as any)?.role === 'admin';
    const isCourier =
      profileData?.role === 'courier' || (session.data?.user as any)?.role === 'courier';

    return [
      ...baseCommands,
      ...(isAuthenticated ? signedInCommands : guestCommands),
      ...(isAdmin ? adminCommands : []),
      ...(isCourier ? courierCommands : []),
    ];
  }, [profileData?.role, session.data?.user, session.status]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const pressedKey = typeof event.key === 'string' ? event.key.toLowerCase() : '';

      if (pressedKey === 'k' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    const handleOpen = () => {
      setOpen(true);
    };

    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener(APP_COMMAND_PALETTE_OPEN_EVENT, handleOpen);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener(APP_COMMAND_PALETTE_OPEN_EVENT, handleOpen);
    };
  }, []);

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      loop
      label='App command menu'
      className='flex max-h-[70vh] flex-col overflow-hidden rounded-lg bg-background text-foreground'
      overlayClassName='fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm'
      contentClassName='fixed left-1/2 top-20 z-[90] w-[min(calc(100vw-2rem),42rem)] -translate-x-1/2 overflow-hidden rounded-lg border border-border bg-background shadow-2xl outline-none'
    >
      <DialogPrimitive.Title className='sr-only'>App command menu</DialogPrimitive.Title>
      <DialogPrimitive.Description className='sr-only'>
        Search app routes and actions.
      </DialogPrimitive.Description>

      <div className='border-b border-border p-4'>
        <div className='flex h-12 items-center gap-3 rounded-md border border-input bg-background px-3'>
          <Search className='size-5 shrink-0 text-muted-foreground' />
          <Command.Input
            data-slot='input'
            autoFocus
            placeholder='Search routes and actions...'
            className='mb-0 h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-foreground shadow-none outline-none placeholder:text-muted-foreground focus:border-0 focus:ring-0 focus-visible:ring-0'
          />
          <button
            data-slot='button'
            type='button'
            onClick={() => setOpen(false)}
            className='inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
            aria-label='Close command menu'
          >
            <X className='size-4' />
          </button>
        </div>
      </div>

      <Command.List className='max-h-[55vh] overflow-y-auto p-2'>
        <Command.Empty className='px-3 py-10 text-center text-sm text-muted-foreground'>
          No matching route or action found.
        </Command.Empty>

        {groupOrder.map((group) => {
          const groupCommands = commands.filter((command) => command.group === group);

          if (groupCommands.length === 0) {
            return null;
          }

          return (
            <Command.Group
              key={group}
              heading={group}
              className='p-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2'
            >
              {groupCommands.map((command) => {
                const Icon = command.icon;

                return (
                  <Command.Item
                    key={command.href}
                    value={`${command.label} ${command.description}`}
                    keywords={command.keywords}
                    onSelect={() => handleSelect(command.href)}
                    className='flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm outline-none transition aria-selected:bg-primary aria-selected:text-primary-foreground data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground'
                  >
                    <Icon className='size-4 shrink-0' />
                    <span className='min-w-0 flex-1'>
                      <span className='block font-medium'>{command.label}</span>
                      <span className='block truncate text-xs opacity-70'>
                        {command.description}
                      </span>
                    </span>
                  </Command.Item>
                );
              })}
            </Command.Group>
          );
        })}
      </Command.List>
    </Command.Dialog>
  );
};

export default AppCommandPalette;
