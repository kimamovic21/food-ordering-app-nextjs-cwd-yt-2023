'use client';

import * as z from 'zod';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
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
import Link from 'next/link';
import GoogleButton from 'react-google-button';
import InputPasswordStrengthDemo from '@/components/shadcn-studio/input/input-46';
import { strongPasswordSchema } from '@/libs/password';

const registerSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters.' })
    .max(50, { message: 'Name must be 50 characters or fewer.' }),
  email: z
    .string()
    .email({ message: 'Please enter a valid email address.' })
    .max(100, { message: 'Email must be 100 characters or fewer.' }),
  password: strongPasswordSchema,
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterUserForm = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseBody = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(responseBody?.error || 'Registration failed');
      }

      form.reset();

      if (responseBody?.verificationRequired) {
        sonnerToast.success('Check your inbox to verify your email address.', {
          style: { backgroundColor: '#22c55e', color: 'white' },
        });
        setTimeout(() => {
          router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        }, 1500);
        return;
      }

      sonnerToast.success('User created successfully! Please login.', {
        style: { backgroundColor: '#22c55e', color: 'white' },
      });

      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err) {
      console.error(err);
      sonnerToast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
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
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder='Enter your name'
                    disabled={isLoading}
                    aria-invalid={!!form.formState.errors.name}
                    className={
                      'rounded-md ' +
                      (form.formState.errors.name
                        ? 'border-2 border-destructive ring-1 ring-destructive'
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
                        ? 'border-2 border-destructive ring-1 ring-destructive'
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
                    {/* Password strength component, now controlled by react-hook-form */}
                    <InputPasswordStrengthDemo value={field.value} onChange={field.onChange} />
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
            {isLoading ? 'Creating account...' : 'Register'}
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
        <span className='text-sm text-muted-foreground mr-2'>Already have an account?</span>
        <Link href='/login' className='text-sm font-medium text-primary hover:underline'>
          Login here
        </Link>
      </div>
    </div>
  );
};

export default RegisterUserForm;
