'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import GoogleIcon from '@/public/google.png';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);
  const [userCreated, setUserCreated] = useState(false);
  const [error, setError] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setCreatingUser(true);
    setError(false);
    setUserCreated(false);

    try {
      await fetch('/api/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setCreatingUser(false);
      setUserCreated(true);
    } catch (err) {
      console.error(err);
      setError(true);
    }
  };

  return (
    <section className='mt-8 w-lg'>
      <h2 className='text-center text-primary text-4xl mb-4'>Register</h2>

      {userCreated && (
        <div className='my-4 text-center text-green-700'>
          <span className='mr-1'>User created. Now you can</span>
          <Link href={'/login'} className='underline'>
            Login.
          </Link>
        </div>
      )}

      {error && (
        <div className='my-4 text-center text-red-700'>There was an error. Please try again.</div>
      )}

      <form className='w-full' onSubmit={handleFormSubmit}>
        <input
          name='name'
          type='text'
          placeholder='name'
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={creatingUser}
          required
        />

        <input
          name='email'
          type='text'
          placeholder='email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={creatingUser}
          required
        />

        <input
          name='password'
          type='password'
          placeholder='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={creatingUser}
          required
        />

        <button type='submit' disabled={creatingUser}>
          Register
        </button>
        <p className='my-4 text-center text-gray-500'>or register with provider</p>
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
          Register with Google
        </button>

        <div className='text-center my-4 border-t border-gray-500 pt-4'>
          <span className='mr-1 text-gray-500'>Existing account?</span>
          <Link href={'/login'} className='underline text-blue-600'>
            Login here
          </Link>
        </div>
      </form>
    </section>
  );
};

export default RegisterPage;
