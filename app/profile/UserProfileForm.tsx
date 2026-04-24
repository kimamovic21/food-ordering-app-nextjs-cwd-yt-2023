'use client';

import { FormEvent } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type UserProfileFormProps = {
  userName: string;
  email?: string | null;
  phone: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  country: string;
  provider?: string | null;
  isSaving?: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onStreetAddressChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onDeleteAccount?: () => void;
  isDeleting?: boolean;
};

const UserProfileForm = ({
  userName,
  email,
  phone,
  streetAddress,
  postalCode,
  city,
  country,
  provider,
  isSaving,
  onSubmit,
  onNameChange,
  onPhoneChange,
  onStreetAddressChange,
  onPostalCodeChange,
  onCityChange,
  onCountryChange,
  onDeleteAccount,
  isDeleting,
}: UserProfileFormProps) => {
  return (
    <form className='grow min-w-0 max-w-3xl space-y-4' onSubmit={onSubmit}>
      <div className='space-y-2'>
        <Label htmlFor='name'>Full name</Label>
        <Input
          id='name'
          type='text'
          placeholder='First and last name'
          value={userName}
          onChange={(e) => onNameChange(e.target.value)}
          disabled={isSaving}
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='email'>Email</Label>
        <Input id='email' type='email' disabled value={email || ''} />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='phone'>Phone number</Label>
        <Input
          id='phone'
          type='tel'
          placeholder='Phone number'
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          disabled={isSaving}
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='streetAddress'>Street address</Label>
        <Input
          id='streetAddress'
          type='text'
          placeholder='Street address'
          value={streetAddress}
          onChange={(e) => onStreetAddressChange(e.target.value)}
          disabled={isSaving}
        />
      </div>

      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='city'>City</Label>
          <Input
            id='city'
            type='text'
            placeholder='City'
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            disabled={isSaving}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='postalCode'>Postal code</Label>
          <Input
            id='postalCode'
            type='text'
            placeholder='Postal code'
            value={postalCode}
            onChange={(e) => onPostalCodeChange(e.target.value)}
            disabled={isSaving}
          />
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='country'>Country</Label>
        <Input
          id='country'
          type='text'
          placeholder='Country'
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
          disabled={isSaving}
        />
      </div>

      <Button type='submit' disabled={isSaving} className='w-full'>
        {isSaving ? 'Saving...' : 'Save'}
      </Button>

      {provider === 'oauth' ? (
        <p className='w-full rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground break-words'>
          You registered with Google, so password updates are not available. Use your Google
          account to sign in.
        </p>
      ) : (
        <Button asChild className='w-full'>
          <Link href='/profile/change-password'>Change password</Link>
        </Button>
      )}

      {/* Delete Account Button Below Save */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type='button'
            variant='destructive'
            className='w-full bg-red-700 hover:bg-red-800 text-white font-semibold mt-2 rounded-md!'
            disabled={isDeleting || isSaving}
          >
            Delete Account
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and remove
              your data from our servers. Your order history will be preserved in our records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteAccount}
              disabled={isDeleting}
              className='bg-red-700 text-white hover:bg-red-800 font-semibold'
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
};

export default UserProfileForm;
