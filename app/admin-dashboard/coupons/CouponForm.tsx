'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  getCouponDateBounds,
  getCouponDateValidationError,
  normalizeCouponCode,
} from '@/libs/coupon';

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

export type CouponFormInitialValues = Partial<{
  code: string;
  title: string;
  description: string;
  discountValue: number;
  minimumOrderAmount: number;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usagePerCustomer: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  isPublic: boolean;
  firstOrderOnly: boolean;
  terms: string;
  tags: string[];
}>;

type CouponFormProps = {
  initialValues?: CouponFormInitialValues;
  submitLabel: string;
  onSubmit: (values: CouponFormSubmitValues) => Promise<void>;
  isSubmitting?: boolean;
};

const toDateTimeLocal = (value?: string | Date | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
};

const getDefaultCouponDates = () => {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  return {
    startsAt: toDateTimeLocal(now),
    expiresAt: toDateTimeLocal(expiresAt),
  };
};

const { minStartsAt, maxExpiresAt } = getCouponDateBounds();

const buildInitialFormState = (initialValues?: CouponFormInitialValues) => {
  const defaultCouponDates = getDefaultCouponDates();

  return {
    code: normalizeCouponCode(initialValues?.code || ''),
    title: initialValues?.title || '',
    description: initialValues?.description || '',
    discountValue: String(initialValues?.discountValue ?? 10),
    minimumOrderAmount: String(initialValues?.minimumOrderAmount ?? 0),
    maxDiscountAmount: initialValues?.maxDiscountAmount
      ? String(initialValues.maxDiscountAmount)
      : '',
    usageLimit: initialValues?.usageLimit ? String(initialValues.usageLimit) : '',
    usagePerCustomer: String(initialValues?.usagePerCustomer ?? 1),
    startsAt: initialValues?.startsAt
      ? toDateTimeLocal(initialValues.startsAt)
      : defaultCouponDates.startsAt,
    expiresAt: initialValues?.expiresAt
      ? toDateTimeLocal(initialValues.expiresAt)
      : defaultCouponDates.expiresAt,
    isActive: initialValues?.isActive ?? true,
    isPublic: initialValues?.isPublic ?? true,
    firstOrderOnly: initialValues?.firstOrderOnly ?? false,
    terms: initialValues?.terms || '',
    tags: (initialValues?.tags || []).join(', '),
  };
};

const CouponForm = ({
  initialValues,
  submitLabel,
  onSubmit,
  isSubmitting = false,
}: CouponFormProps) => {
  const [formData, setFormData] = useState(() => buildInitialFormState(initialValues));
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === 'code' && typeof value === 'string' ? normalizeCouponCode(value) : value,
    }));
    if (formError) {
      setFormError(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const code = normalizeCouponCode(formData.code);
    const discountValue = Number(formData.discountValue);
    const minimumOrderAmount = Number(formData.minimumOrderAmount || 0);
    const maxDiscountAmount = formData.maxDiscountAmount.trim()
      ? Number(formData.maxDiscountAmount)
      : null;
    const usageLimit = formData.usageLimit.trim() ? Number(formData.usageLimit) : null;
    const usagePerCustomer = Number(formData.usagePerCustomer || 1);

    if (!code || code.length < 4) {
      setFormError('Coupon code must be at least 4 characters long.');
      return;
    }

    if (!/^[A-Z0-9]+$/.test(code)) {
      setFormError('Coupon code can only contain capital letters and numbers.');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      setFormError('Title and description are required.');
      return;
    }

    if (!Number.isFinite(discountValue) || discountValue < 5 || discountValue > 90) {
      setFormError('Discount percentage must be between 5 and 90.');
      return;
    }

    if (Number.isNaN(minimumOrderAmount) || minimumOrderAmount < 0) {
      setFormError('Minimum order amount must be 0 or greater.');
      return;
    }

    if (
      maxDiscountAmount !== null &&
      (!Number.isFinite(maxDiscountAmount) || maxDiscountAmount < 0)
    ) {
      setFormError('Maximum discount amount must be 0 or greater.');
      return;
    }

    if (usageLimit !== null && (Number.isNaN(usageLimit) || usageLimit < 1)) {
      setFormError('Usage limit must be at least 1.');
      return;
    }

    if (!Number.isFinite(usagePerCustomer) || usagePerCustomer < 1) {
      setFormError('Usage per customer must be at least 1.');
      return;
    }

    const dateValidationError = getCouponDateValidationError({
      startsAt: formData.startsAt,
      expiresAt: formData.expiresAt,
    });

    if (dateValidationError) {
      setFormError(dateValidationError);
      return;
    }

    try {
      await onSubmit({
        code,
        title: formData.title.trim(),
        description: formData.description.trim(),
        discountValue,
        minimumOrderAmount,
        maxDiscountAmount,
        usageLimit,
        usagePerCustomer,
        startsAt: formData.startsAt,
        expiresAt: formData.expiresAt || null,
        isActive: formData.isActive,
        isPublic: formData.isPublic,
        firstOrderOnly: formData.firstOrderOnly,
        terms: formData.terms.trim(),
        tags: formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save coupon.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='grid gap-5 md:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='code'>Coupon code</Label>
          <Input
            id='code'
            value={formData.code}
            onChange={(event) => handleChange('code', event.target.value)}
            placeholder='SAVE10'
            className='uppercase'
            autoComplete='off'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='title'>Title</Label>
          <Input
            id='title'
            value={formData.title}
            onChange={(event) => handleChange('title', event.target.value)}
            placeholder='Weekend special'
          />
        </div>

        <div className='space-y-2 md:col-span-2'>
          <Label htmlFor='description'>Description</Label>
          <Textarea
            id='description'
            value={formData.description}
            onChange={(event) => handleChange('description', event.target.value)}
            placeholder='Short explanation customers see when the coupon is valid.'
            rows={4}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='discountValue'>Discount percentage</Label>
          <Input
            id='discountValue'
            type='number'
            min='5'
            max='90'
            step='5'
            value={formData.discountValue}
            onChange={(event) => handleChange('discountValue', event.target.value)}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='minimumOrderAmount'>Minimum order amount</Label>
          <Input
            id='minimumOrderAmount'
            type='number'
            min='0'
            step='0.01'
            value={formData.minimumOrderAmount}
            onChange={(event) => handleChange('minimumOrderAmount', event.target.value)}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='maxDiscountAmount'>Maximum discount amount</Label>
          <Input
            id='maxDiscountAmount'
            type='number'
            min='0'
            step='0.01'
            value={formData.maxDiscountAmount}
            onChange={(event) => handleChange('maxDiscountAmount', event.target.value)}
            placeholder='Optional cap'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='usageLimit'>Total usage limit</Label>
          <Input
            id='usageLimit'
            type='number'
            min='1'
            step='1'
            value={formData.usageLimit}
            onChange={(event) => handleChange('usageLimit', event.target.value)}
            placeholder='Optional limit'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='usagePerCustomer'>Usage per customer</Label>
          <Input
            id='usagePerCustomer'
            type='number'
            min='1'
            step='1'
            value={formData.usagePerCustomer}
            onChange={(event) => handleChange('usagePerCustomer', event.target.value)}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='startsAt'>Starts at</Label>
          <Input
            id='startsAt'
            type='datetime-local'
            min={toDateTimeLocal(minStartsAt)}
            value={formData.startsAt}
            onChange={(event) => handleChange('startsAt', event.target.value)}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='expiresAt'>Expires at</Label>
          <Input
            id='expiresAt'
            type='datetime-local'
            min={formData.startsAt || toDateTimeLocal(minStartsAt)}
            max={toDateTimeLocal(maxExpiresAt)}
            value={formData.expiresAt}
            onChange={(event) => handleChange('expiresAt', event.target.value)}
          />
        </div>

        <div className='space-y-2 md:col-span-2'>
          <Label htmlFor='terms'>Terms</Label>
          <Textarea
            id='terms'
            value={formData.terms}
            onChange={(event) => handleChange('terms', event.target.value)}
            placeholder='Optional small-print terms or restrictions.'
            rows={3}
          />
        </div>

        <div className='space-y-2 md:col-span-2'>
          <Label htmlFor='tags'>Tags</Label>
          <Input
            id='tags'
            value={formData.tags}
            onChange={(event) => handleChange('tags', event.target.value)}
            placeholder='weekend, vip, lunch'
          />
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <label className='flex items-center gap-3 rounded-lg border border-border p-4'>
          <input
            type='checkbox'
            checked={formData.isActive}
            onChange={(event) => handleChange('isActive', event.target.checked)}
            className='h-4 w-4 rounded border-border'
          />
          <span className='text-sm font-medium'>Active coupon</span>
        </label>

        <label className='flex items-center gap-3 rounded-lg border border-border p-4'>
          <input
            type='checkbox'
            checked={formData.isPublic}
            onChange={(event) => handleChange('isPublic', event.target.checked)}
            className='h-4 w-4 rounded border-border'
          />
          <span className='text-sm font-medium'>Show publicly in checkout</span>
        </label>

        <label className='flex items-center gap-3 rounded-lg border border-border p-4'>
          <input
            type='checkbox'
            checked={formData.firstOrderOnly}
            onChange={(event) => handleChange('firstOrderOnly', event.target.checked)}
            className='h-4 w-4 rounded border-border'
          />
          <span className='text-sm font-medium'>First order only</span>
        </label>
      </div>

      {formError && (
        <div className='rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200'>
          {formError}
        </div>
      )}

      <div className='flex items-center gap-3'>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
        <p className='text-xs text-muted-foreground'>
          Codes use uppercase letters and numbers only. Percentage discounts stay between 5% and
          90%.
        </p>
      </div>
    </form>
  );
};

export default CouponForm;
