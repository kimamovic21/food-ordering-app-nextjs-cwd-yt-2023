'use client';

import * as z from 'zod';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import GoogleButton from 'react-google-button';
import Link from 'next/link';
import InputPasswordEyeOnly from './InputPasswordEyeOnly';

const loginSchema = z.object({
  email: z
    .string()
    .email({ message: 'Please enter a valid email address.' })
    .max(100, { message: 'Email must be 100 characters or fewer.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' })
    .max(64, { message: 'Password must be 64 characters or fewer.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginUserForm = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
        callbackUrl: '/',
      });

      if (result?.error) {
        if (result.error === 'EMAIL_NOT_VERIFIED') {
          toast.error('Please verify your email address before signing in.', {
            style: { backgroundColor: '#ef4444', color: 'white' },
          });
          router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
          return;
        }

        const accountStatusResponse = await fetch('/api/account-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: values.email }),
        });

        const accountStatus = await accountStatusResponse.json().catch(() => null);

        if (accountStatus?.found && accountStatus?.provider === 'oauth') {
          toast.error('This account uses Google sign-in. Use the Google button instead.', {
            style: { backgroundColor: '#ef4444', color: 'white' },
          });
          return;
        }

        if (
          accountStatus?.found &&
          accountStatus?.provider === 'credentials' &&
          !accountStatus?.emailVerified
        ) {
          toast.error('Please verify your email address before signing in.', {
            style: { backgroundColor: '#ef4444', color: 'white' },
          });
          router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
          return;
        }

        toast.error('Invalid email or password.', {
          style: { backgroundColor: '#ef4444', color: 'white' },
        });
        return;
      }

      toast.success('Welcome back!', {
        style: { backgroundColor: '#22c55e', color: 'white' },
      });
      router.push(result?.url || '/');
    } catch (err) {
      console.error(err);
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    signIn('google', {
      callbackUrl: '/',
    });
  };

  return (
    <div className='w-full max-w-3xl mx-auto space-y-6'>
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
                    aria-invalid={!!form.formState.errors.email}
                    className={
                      'rounded-md!' +
                      (form.formState.errors.email
                        ? ' border-2 border-destructive ring-1 ring-destructive'
                        : '')
                    }
                    {...field}
                  />
                </FormControl>
                <FormMessage className='text-destructive' />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div>
                    {/* Password input with only eye icon */}
                    <InputPasswordEyeOnly value={field.value} onChange={field.onChange} />
                  </div>
                </FormControl>
                {form.formState.errors.password && (
                  <FormMessage className='text-destructive'>
                    {form.formState.errors.password.message}
                  </FormMessage>
                )}
              </FormItem>
            )}
          />

          <Button type='submit' className='w-full' disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Login'}
          </Button>
        </form>
      </Form>

      <div className='relative'>
        <div className='absolute inset-0 flex items-center'>
          <span className='w-full border-t border-border' />
        </div>
        <div className='relative flex justify-center text-xs uppercase'>
          <span className='bg-background px-2 text-muted-foreground'>Or</span>
        </div>
      </div>

      <div className='flex justify-center'>
        <GoogleButton
          label='Continue with Google'
          onClick={handleGoogleSignIn}
          type='light'
          className='dark:opacity-90 hover:opacity-80 transition-opacity'
        />
      </div>

      <div className='text-center pt-4 border-t border-border'>
        <span className='text-sm text-muted-foreground mr-2'>Don&apos;t have an account?</span>
        <Link href='/register' className='text-sm font-medium text-primary hover:underline'>
          Register here
        </Link>
      </div>

      <div className='text-center text-sm text-muted-foreground'>
        Forgot your password?{' '}
        <Link href='/forgot-password' className='font-medium text-primary hover:underline'>
          Reset it here
        </Link>
      </div>
    </div>
  );
};

export default LoginUserForm;
