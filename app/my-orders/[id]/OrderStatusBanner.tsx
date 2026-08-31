import type { ComponentType } from 'react';
import { ChefHat, CheckCircle2, Clock, Truck, PackageCheck, XCircle } from 'lucide-react';
import type { OrderStatus } from '@/types/order';

export type { OrderStatus } from '@/types/order';

type StatusTone = 'amber' | 'sky' | 'blue' | 'green' | 'red';

type ToneStyles = {
  wrapper: string;
  icon: string;
  title: string;
  body: string;
};

const statusToneStyles: Record<StatusTone, ToneStyles> = {
  amber: {
    wrapper: 'bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800',
    icon: 'text-amber-600 dark:text-amber-300',
    title: 'text-amber-900 dark:text-amber-100',
    body: 'text-amber-800 dark:text-amber-200',
  },
  sky: {
    wrapper: 'bg-sky-50 dark:bg-sky-950 border border-sky-200 dark:border-sky-800',
    icon: 'text-sky-600 dark:text-sky-300',
    title: 'text-sky-900 dark:text-sky-100',
    body: 'text-sky-800 dark:text-sky-200',
  },
  blue: {
    wrapper: 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-300',
    title: 'text-blue-900 dark:text-blue-100',
    body: 'text-blue-800 dark:text-blue-200',
  },
  green: {
    wrapper: 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-300',
    title: 'text-green-900 dark:text-green-100',
    body: 'text-green-800 dark:text-green-200',
  },
  red: {
    wrapper: 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-300',
    title: 'text-red-900 dark:text-red-100',
    body: 'text-red-800 dark:text-red-200',
  },
};

const statusContent: Record<
  OrderStatus,
  {
    title: string;
    description: string;
    subtext?: string;
    icon: ComponentType<{ className?: string }>;
    tone: StatusTone;
  }
> = {
  placed: {
    title: 'Order placed',
    description: 'We received your order and are confirming the details.',
    subtext: 'You will get an update as soon as the kitchen starts preparing it.',
    icon: Clock,
    tone: 'amber',
  },
  processing: {
    title: "We're preparing your order",
    description: 'Our kitchen is cooking your items and packaging them with care.',
    subtext: 'Typical prep takes 10–20 minutes before handoff to a courier.',
    icon: ChefHat,
    tone: 'sky',
  },
  ready: {
    title: 'Order is ready for pickup',
    description: 'Your order has been prepared and is waiting to be assigned to a courier.',
    subtext: 'A courier will be assigned shortly to deliver your order.',
    icon: PackageCheck,
    tone: 'blue',
  },
  transportation: {
    title: 'Your order is on the way',
    description:
      'Our courier picked up your order and is heading to you. Expect a call from the courier soon.',
    subtext: 'Keep this page open to track live progress on the map below.',
    icon: Truck,
    tone: 'blue',
  },
  delivered: {
    title: 'Delivery needs your confirmation',
    description: 'The courier marked this order as delivered.',
    subtext: 'Please confirm the delivery if you received your food.',
    icon: PackageCheck,
    tone: 'amber',
  },
  completed: {
    title: 'Order delivered successfully',
    description: 'Thanks for your purchase! Enjoy your meal.',
    subtext: 'If anything looks off, reach out and we will make it right.',
    icon: CheckCircle2,
    tone: 'green',
  },
  canceled: {
    title: 'Order canceled',
    description: 'This order was canceled and is no longer active.',
    subtext: 'You can place a new order whenever you are ready.',
    icon: XCircle,
    tone: 'red',
  },
};

type OrderStatusBannerProps = {
  status: OrderStatus;
  estimatedPreparationMinutes?: number | null;
  estimatedDeliveryMinutes?: number | null;
};

const formatEstimate = (minutes?: number | null) => {
  const value = Number(minutes);
  return Number.isFinite(value) && value > 0 ? `${value} min` : null;
};

const OrderStatusBanner = ({
  status,
  estimatedPreparationMinutes,
  estimatedDeliveryMinutes,
}: OrderStatusBannerProps) => {
  const content = statusContent[status];
  if (!content) return null;

  const Icon = content.icon;
  const tone = statusToneStyles[content.tone];
  const prepEstimate = formatEstimate(estimatedPreparationMinutes);
  const deliveryEstimate = formatEstimate(estimatedDeliveryMinutes);
  const estimateSubtext =
    status === 'processing' && prepEstimate
      ? `Estimated kitchen preparation: ${prepEstimate}.`
      : status === 'transportation' && deliveryEstimate
        ? `Estimated delivery travel time: ${deliveryEstimate}.`
        : content.subtext;

  return (
    <div className={`${tone.wrapper} rounded-lg mt-4 p-6 mb-6`}>
      <div className='flex items-start gap-3'>
        <div className={`${tone.icon} rounded-full bg-white/70 dark:bg-black/30 p-2`}>
          <Icon className='h-5 w-5' aria-hidden />
        </div>
        <div className='space-y-1'>
          <h3 className={`font-semibold text-lg ${tone.title}`}>{content.title}</h3>
          <p className={`${tone.body}`}>{content.description}</p>
          {estimateSubtext ? <p className={`${tone.body} text-sm`}>{estimateSubtext}</p> : null}
        </div>
      </div>
    </div>
  );
};

export default OrderStatusBanner;
