'use client';

import { FormEvent } from 'react';

type UserProfileFormProps = {
  userName: string;
  email?: string | null;
  phone: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  country: string;
  isSaving?: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onStreetAddressChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onCountryChange: (value: string) => void;
};

const UserProfileForm = ({
  userName,
  email,
  phone,
  streetAddress,
  postalCode,
  city,
  country,
  isSaving,
  onSubmit,
  onNameChange,
  onPhoneChange,
  onStreetAddressChange,
  onPostalCodeChange,
  onCityChange,
  onCountryChange,
}: UserProfileFormProps) => {
  return (
    <form className='grow' onSubmit={onSubmit}>
      <input
        type='text'
        placeholder='First and last name'
        value={userName}
        onChange={(e) => onNameChange(e.target.value)}
        disabled={isSaving}
      />

      <input type='email' disabled value={email || ''} />

      <input
        type='tel'
        placeholder='Phone number'
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
      />

      <input
        type='text'
        placeholder='Street address'
        value={streetAddress}
        onChange={(e) => onStreetAddressChange(e.target.value)}
      />

      <div className='flex gap-4'>
        <input
          type='text'
          placeholder='City'
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
        />

        <input
          type='text'
          placeholder='Postal code'
          value={postalCode}
          onChange={(e) => onPostalCodeChange(e.target.value)}
        />
      </div>

      <input
        type='text'
        placeholder='Country'
        value={country}
        onChange={(e) => onCountryChange(e.target.value)}
      />

      <button type='submit' disabled={isSaving}>
        Save
      </button>
    </form>
  );
};

export default UserProfileForm;