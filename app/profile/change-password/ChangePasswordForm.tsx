'use client';

import * as z from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import InputPasswordEyeOnly from '@/app/(auth)/login/InputPasswordEyeOnly';
import InputPasswordStrengthDemo from '@/components/shadcn-studio/input/input-46';
import { strongPasswordSchema } from '@/libs/password';

const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: 'Current password is required.' })
      .max(64, { message: 'Current password must be 64 characters or fewer.' }),
    newPassword: strongPasswordSchema,
    confirmNewPassword: z
      .string()
      .min(1, { message: 'Please confirm your new password.' })
      .max(64, { message: 'Password confirmation must be 64 characters or fewer.' }),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmNewPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match.',
        path: ['confirmNewPassword'],
      });
    }
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

const ChangePasswordForm = () => {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/profile/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const responseBody = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(responseBody?.error || 'Failed to update password.');
      }

      toast.success('Password updated successfully!', {
        style: { backgroundColor: '#22c55e', color: 'white' },
      });
      form.reset();
      router.push('/profile');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update password.', {
        style: { backgroundColor: '#ef4444', color: 'white' },
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className='w-full max-w-3xl mx-auto space-y-6'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          <FormField
            control={form.control}
            name='currentPassword'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current password</FormLabel>
                <FormControl>
                  <InputPasswordEyeOnly
                    value={field.value}
                    onChange={field.onChange}
                    placeholder='Enter your current password'
                    disabled={isSaving}
                  />
                </FormControl>
                <FormMessage className='text-destructive' />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='newPassword'
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <InputPasswordStrengthDemo value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage className='text-destructive' />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='confirmNewPassword'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm new password</FormLabel>
                <FormControl>
                  <InputPasswordEyeOnly
                    value={field.value}
                    onChange={field.onChange}
                    placeholder='Confirm your new password'
                    disabled={isSaving}
                  />
                </FormControl>
                <FormMessage className='text-destructive' />
              </FormItem>
            )}
          />

          <Button type='submit' className='w-full' disabled={isSaving}>
            {isSaving ? 'Updating password...' : 'Update password'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ChangePasswordForm;
