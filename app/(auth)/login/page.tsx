'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import GoogleIcon from '@/public/google.png';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setLoginInProgress(true);

      await signIn('credentials', {
        email,
        password,
        callbackUrl: '/',
      });

      setLoginInProgress(false);
    } catch (err) {
      console.error(err);
      setError(true);
    }
  };

  return (
    <section className='mt-8 w-lg'>
      <h2 className='text-center text-primary text-4xl mb-4'>Login</h2>

      {error && (
        <div className='my-4 text-center text-red-700'>There was an error. Please try again.</div>
      )}

      <form className='w-full' onSubmit={handleFormSubmit}>
        <input
          name='email'
          type='text'
          placeholder='email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loginInProgress}
          required
        />

        <input
          name='password'
          type='password'
          placeholder='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loginInProgress}
          required
        />

        <button type='submit' disabled={loginInProgress}>
          Login
        </button>
        <p className='my-4 text-center text-gray-500'>or login with provider</p>
        <button
          type='button'
          className='flex items-center gap-4'
          onClick={() =>
            signIn('google', {
              callbackUrl: '/',
            })
          }
        >
          <Image src={GoogleIcon} alt='Google Icon' width={24} height={24} />
          Login with Google
        </button>

        <div className='text-center my-4 border-t border-gray-500 pt-4'>
          <span className='mr-1 text-gray-500'>Don&apos;t have an account?</span>
          <Link href={'/register'} className='underline text-blue-600'>
            Register here
          </Link>
        </div>
      </form>
    </section>
  );
};

export default LoginPage;
