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

const resetPasswordSchema = z
  .object({
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

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

type ResetPasswordFormProps = {
  token: string;
};

const ResetPasswordForm = ({ token }: ResetPasswordFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...values }),
      });

      const responseBody = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(responseBody?.error || 'Failed to reset password.');
      }

      toast.success(responseBody?.message || 'Password reset successfully.', {
        style: { backgroundColor: '#22c55e', color: 'white' },
      });
      form.reset();
      router.push('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reset password.', {
        style: { backgroundColor: '#ef4444', color: 'white' },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <FormField
          control={form.control}
          name='newPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <div>
                  <InputPasswordStrengthDemo value={field.value} onChange={field.onChange} />
                </div>
              </FormControl>
              {form.formState.errors.newPassword && (
                <FormMessage className='text-destructive'>
                  {form.formState.errors.newPassword.message}
                </FormMessage>
              )}
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
                  placeholder='Confirm new password'
                />
              </FormControl>
              <FormMessage className='text-destructive' />
            </FormItem>
          )}
        />

        <Button type='submit' className='w-full' disabled={isLoading}>
          {isLoading ? 'Resetting...' : 'Reset password'}
        </Button>
      </form>
    </Form>
  );
};

export default ResetPasswordForm;
