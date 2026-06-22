'use client';

import * as z from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
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

const resendSchema = z.object({
  email: z
    .string()
    .email({ message: 'Please enter a valid email address.' })
    .max(100, { message: 'Email must be 100 characters or fewer.' }),
});

type ResendFormValues = z.infer<typeof resendSchema>;

type ResendVerificationFormProps = {
  defaultEmail?: string;
};

const ResendVerificationForm = ({ defaultEmail = '' }: ResendVerificationFormProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ResendFormValues>({
    resolver: zodResolver(resendSchema),
    defaultValues: {
      email: defaultEmail,
    },
  });

  const onSubmit = async (values: ResendFormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const responseBody = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(responseBody?.error || 'Failed to resend verification email.');
      }

      sonnerToast.success(responseBody?.message || 'Verification email sent.', {
        style: { backgroundColor: '#22c55e', color: 'white' },
      });
    } catch (error) {
      sonnerToast.error(
        error instanceof Error ? error.message : 'Failed to resend verification email.',
        {
          style: { backgroundColor: '#ef4444', color: 'white' },
        }
      );
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
          {isLoading ? 'Sending...' : 'Resend verification email'}
        </Button>
      </form>
    </Form>
  );
};

export default ResendVerificationForm;
