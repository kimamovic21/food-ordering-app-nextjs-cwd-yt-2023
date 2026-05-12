'use client';

import * as z from 'zod';
import { useState } from 'react';
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
import { Input } from '@/components/ui/input';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email({ message: 'Please enter a valid email address.' })
    .max(100, { message: 'Email must be 100 characters or fewer.' }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordForm = () => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const responseBody = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(responseBody?.error || 'Failed to request password reset.');
      }

      if (responseBody?.canResetPassword === false) {
        toast.error(responseBody?.message || 'Google sign-in accounts cannot reset passwords.', {
          style: { backgroundColor: '#ef4444', color: 'white' },
        });
        return;
      }

      toast.success(responseBody?.message || 'Password reset email sent.', {
        style: { backgroundColor: '#22c55e', color: 'white' },
      });
      form.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to request password reset.', {
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
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type='email'
                  placeholder='Enter your email'
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage className='text-destructive' />
            </FormItem>
          )}
        />

        <Button type='submit' className='w-full' disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>
    </Form>
  );
};

export default ForgotPasswordForm;
