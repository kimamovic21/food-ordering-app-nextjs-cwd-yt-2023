'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { MapPin, Plus, Minus, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import dynamic from 'next/dynamic';

const OrderMap = dynamic(() => import('@/components/shared/OrderMap'), {
  ssr: false,
  loading: () => <div className='h-[400px] bg-muted animate-pulse rounded-lg' />,
});

interface WorkingHours {
  day: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface BlockedDate {
  date: string;
  reason: string;
}

interface RestaurantFormData {
  _id?: string;
  name: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  contact: string;
  email: string;
  webAddress: string;
  description: string;
  tax: number;
  courierFee: number;
  workingHours: WorkingHours[];
  blockedDates: BlockedDate[];
  totalEmployees: number;
}

interface RestaurantFormProps {
  restaurant?: RestaurantFormData;
  isEdit?: boolean;
}

const defaultWorkingHours: WorkingHours[] = [
  { day: 'monday', openTime: '09:00', closeTime: '21:00', isClosed: false },
  { day: 'tuesday', openTime: '09:00', closeTime: '21:00', isClosed: false },
  { day: 'wednesday', openTime: '09:00', closeTime: '21:00', isClosed: false },
  { day: 'thursday', openTime: '09:00', closeTime: '21:00', isClosed: false },
  { day: 'friday', openTime: '09:00', closeTime: '23:00', isClosed: false },
  { day: 'saturday', openTime: '09:00', closeTime: '23:00', isClosed: false },
  { day: 'sunday', openTime: '10:00', closeTime: '21:00', isClosed: false },
];

export default function RestaurantForm({ restaurant, isEdit = false }: RestaurantFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RestaurantFormData>({
    name: '',
    street: '',
    city: '',
    postalCode: '',
    country: '',
    latitude: 0,
    longitude: 0,
    contact: '',
    email: '',
    webAddress: '',
    description: '',
    tax: 17,
    courierFee: 5,
    workingHours: defaultWorkingHours,
    blockedDates: [],
    totalEmployees: 1,
    ...restaurant,
  });

  const [newBlockedDate, setNewBlockedDate] = useState({ date: '', reason: '' });

  const toIsoDate = (value: string | Date) => {
    if (!value) return '';
    
    // If it's already a Date object
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? '' : value.toISOString();
    }
    
    // If it's a string in YYYY-MM-DD format (from date input)
    if (typeof value === 'string') {
      // Check if it's already in ISO format
      if (value.includes('T')) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? '' : date.toISOString();
      }
      
      // If it's YYYY-MM-DD, append time to avoid timezone issues
      const date = new Date(value + 'T00:00:00.000Z');
      return Number.isNaN(date.getTime()) ? '' : date.toISOString();
    }
    
    return '';
  };

  const buildPayload = (data: RestaurantFormData, includeId: boolean = false) => {
    const payload: any = {
      name: data.name,
      street: data.street,
      city: data.city,
      postalCode: data.postalCode,
      country: data.country,
      latitude: data.latitude,
      longitude: data.longitude,
      contact: data.contact,
      email: data.email,
      webAddress: data.webAddress,
      description: data.description,
      tax: data.tax,
      courierFee: data.courierFee,
      workingHours: data.workingHours,
      blockedDates: data.blockedDates
        .map((blocked) => {
          const isoDate = toIsoDate(blocked.date);
          console.log('Converting blocked date:', blocked.date, '-> ISO:', isoDate);
          return {
            date: isoDate,
            reason: blocked.reason.trim(),
          };
        })
        .filter((blocked) => {
          const isValid = Boolean(blocked.date && blocked.reason);
          console.log('Blocked date valid?', isValid, blocked);
          return isValid;
        }),
      totalEmployees: data.totalEmployees,
    };
    
    if (includeId && data._id) {
      payload._id = data._id;
    }
    
    return payload;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof RestaurantFormData
  ) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    toast.loading('Getting your location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        toast.dismiss();
        toast.success('Location updated successfully');
      },
      (error) => {
        toast.dismiss();
        toast.error('Failed to get location: ' + error.message);
      }
    );
  };

  const handleCourierFeeChange = (increment: boolean) => {
    setFormData((prev) => ({
      ...prev,
      courierFee: Math.max(0, prev.courierFee + (increment ? 0.5 : -0.5)),
    }));
  };

  const handleEmployeesChange = (increment: boolean) => {
    setFormData((prev) => ({
      ...prev,
      totalEmployees: Math.max(1, prev.totalEmployees + (increment ? 1 : -1)),
    }));
  };

  const handleWorkingHoursChange = (
    index: number,
    field: 'openTime' | 'closeTime' | 'isClosed',
    value: string | boolean
  ) => {
    const newWorkingHours = [...formData.workingHours];
    newWorkingHours[index] = {
      ...newWorkingHours[index],
      [field]: value,
    };
    setFormData((prev) => ({ ...prev, workingHours: newWorkingHours }));
  };

  const addBlockedDate = () => {
    if (!newBlockedDate.date || !newBlockedDate.reason) {
      toast.error('Please fill in both date and reason');
      return;
    }

    const normalizedDate = toIsoDate(newBlockedDate.date);
    console.log('Adding blocked date - Input:', newBlockedDate.date, 'Normalized:', normalizedDate);
    
    if (!normalizedDate) {
      toast.error('Please enter a valid date');
      return;
    }

    setFormData((prev) => {
      const newBlockedDates = [
        ...prev.blockedDates,
        { date: normalizedDate, reason: newBlockedDate.reason.trim() },
      ];
      console.log('Updated blockedDates array:', newBlockedDates);
      return {
        ...prev,
        blockedDates: newBlockedDates,
      };
    });
    setNewBlockedDate({ date: '', reason: '' });
    toast.success('Blocked date added');
  };

  const removeBlockedDate = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      blockedDates: prev.blockedDates.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Restaurant name is required');
      return false;
    }
    if (!formData.street.trim()) {
      toast.error('Street address is required');
      return false;
    }
    if (!formData.city.trim()) {
      toast.error('City is required');
      return false;
    }
    if (!formData.postalCode.trim()) {
      toast.error('Postal code is required');
      return false;
    }
    if (!formData.country.trim()) {
      toast.error('Country is required');
      return false;
    }
    if (!formData.latitude || !formData.longitude) {
      toast.error('Location coordinates are required. Please use "Get Current Location" button');
      return false;
    }
    if (!formData.contact.trim()) {
      toast.error('Contact number is required');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return false;
    }
    if (formData.description.length < 20 || formData.description.length > 200) {
      toast.error('Description must be between 20 and 200 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const method = isEdit ? 'PUT' : 'POST';
      const payload = buildPayload(formData, isEdit);
      
      console.log('Submitting restaurant payload:', JSON.stringify(payload, null, 2));
      console.log('Tax value:', payload.tax, 'Type:', typeof payload.tax);
      console.log('Blocked dates count:', payload.blockedDates.length);
      console.log('Blocked dates detail:', payload.blockedDates);

      const response = await fetch('/api/restaurant', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      console.log('Server response:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${isEdit ? 'update' : 'create'} restaurant`);
      }

      toast.success(`Restaurant ${isEdit ? 'updated' : 'created'} successfully`);
      router.push('/restaurant');
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} restaurant`);
    } finally {
      setLoading(false);
    }
  };

  const getDayLabel = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Enter the basic details of your restaurant</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label htmlFor='name' className='mb-2'>
              Restaurant Name *
            </Label>
            <Input
              id='name'
              name='name'
              value={formData.name}
              onChange={handleInputChange}
              placeholder='Enter restaurant name'
              required
            />
          </div>

          <div>
            <Label htmlFor='description' className='mb-2'>
              Description * ({formData.description.length}/200 characters)
            </Label>
            <Textarea
              id='description'
              name='description'
              value={formData.description}
              onChange={handleInputChange}
              placeholder='Describe your restaurant (20-200 characters)'
              rows={4}
              required
              minLength={20}
              maxLength={200}
            />
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
          <CardDescription>Enter your restaurant&apos;s location details</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label htmlFor='street' className='mb-2'>
              Street Address *
            </Label>
            <Input
              id='street'
              name='street'
              value={formData.street}
              onChange={handleInputChange}
              placeholder='Enter street address'
              required
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='city' className='mb-2'>
                City *
              </Label>
              <Input
                id='city'
                name='city'
                value={formData.city}
                onChange={handleInputChange}
                placeholder='Enter city'
                required
              />
            </div>
            <div>
              <Label htmlFor='postalCode' className='mb-2'>
                Postal Code *
              </Label>
              <Input
                id='postalCode'
                name='postalCode'
                value={formData.postalCode}
                onChange={handleInputChange}
                placeholder='Enter postal code'
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor='country' className='mb-2'>
              Country *
            </Label>
            <Input
              id='country'
              name='country'
              value={formData.country}
              onChange={handleInputChange}
              placeholder='Enter country'
              required
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='latitude' className='mb-2'>
                Latitude *
              </Label>
              <Input
                id='latitude'
                name='latitude'
                type='number'
                step='any'
                value={formData.latitude}
                onChange={(e) => handleNumberChange(e, 'latitude')}
                placeholder='Latitude'
                required
              />
            </div>
            <div>
              <Label htmlFor='longitude' className='mb-2'>
                Longitude *
              </Label>
              <Input
                id='longitude'
                name='longitude'
                type='number'
                step='any'
                value={formData.longitude}
                onChange={(e) => handleNumberChange(e, 'longitude')}
                placeholder='Longitude'
                required
              />
            </div>
          </div>

          <Button type='button' onClick={getCurrentLocation} variant='outline' className='w-full'>
            <MapPin className='h-4 w-4 mr-2' />
            Get Current Location
          </Button>

          {formData.latitude !== 0 && formData.longitude !== 0 && (
            <div className='h-[300px] rounded-lg overflow-hidden'>
              <OrderMap
                address={formData.street}
                city={formData.city}
                postalCode={formData.postalCode}
                country={formData.country}
                shouldFetchCourier={false}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>How customers can reach you</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label htmlFor='contact' className='mb-2'>
              Contact Number *
            </Label>
            <Input
              id='contact'
              name='contact'
              type='tel'
              value={formData.contact}
              onChange={handleInputChange}
              placeholder='Enter contact number'
              required
            />
          </div>

          <div>
            <Label htmlFor='email' className='mb-2'>
              Email *
            </Label>
            <Input
              id='email'
              name='email'
              type='email'
              value={formData.email}
              onChange={handleInputChange}
              placeholder='Enter email'
              required
            />
          </div>

          <div>
            <Label htmlFor='webAddress' className='mb-2'>
              Website (Optional)
            </Label>
            <Input
              id='webAddress'
              name='webAddress'
              type='url'
              value={formData.webAddress}
              onChange={handleInputChange}
              placeholder='https://yourwebsite.com'
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing & Fees */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing & Fees</CardTitle>
          <CardDescription>Configure your pricing and tax rules</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label className='mb-2'>Courier Fee *</Label>
            <div className='flex items-center gap-2 mt-2'>
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={() => handleCourierFeeChange(false)}
              >
                <Minus className='h-4 w-4' />
              </Button>
              <Input
                type='number'
                step='0.5'
                min='0'
                value={formData.courierFee}
                onChange={(e) => handleNumberChange(e, 'courierFee')}
                className='text-center'
              />
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={() => handleCourierFeeChange(true)}
              >
                <Plus className='h-4 w-4' />
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor='tax' className='mb-2'>
              Tax Percentage *
            </Label>
            <div className='flex items-center gap-2'>
              <Input
                id='tax'
                type='number'
                placeholder='%'
                min='0'
                max='100'
                step='0.01'
                value={formData.tax}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tax: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)),
                  }))
                }
                required
              />
              <span className='text-muted-foreground'>%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Working Hours</CardTitle>
          <CardDescription>Set your restaurant&apos;s operating hours</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          {/* Header Row */}
          <div className='flex items-center gap-2 pb-2 border-b-2'>
            <div className='w-20 text-xs font-semibold text-muted-foreground shrink-0'>Day</div>
            <div className='flex items-center gap-2 flex-1 min-w-0'>
              <div className='w-32 text-xs font-semibold text-muted-foreground shrink-0'>
                Start Time
              </div>
              <span className='text-xs shrink-0 invisible'>-</span>
              <div className='w-32 text-xs font-semibold text-muted-foreground shrink-0'>
                End Time
              </div>
            </div>
            <div className='w-10 text-xs font-semibold text-muted-foreground text-center shrink-0'>
              Closed
            </div>
          </div>

          {formData.workingHours.map((hours, index) => (
            <div key={index} className='flex items-center gap-2 py-2 border-b last:border-0'>
              <div className='w-20 font-medium text-sm shrink-0'>{getDayLabel(hours.day)}</div>
              <div className='flex items-center gap-2 flex-1 min-w-0'>
                <Input
                  type='time'
                  value={hours.openTime}
                  onChange={(e) => handleWorkingHoursChange(index, 'openTime', e.target.value)}
                  disabled={hours.isClosed}
                  className='w-32 text-sm h-9 shrink-0'
                />
                <span className='text-xs text-muted-foreground shrink-0'>-</span>
                <Input
                  type='time'
                  value={hours.closeTime}
                  onChange={(e) => handleWorkingHoursChange(index, 'closeTime', e.target.value)}
                  disabled={hours.isClosed}
                  className='w-32 text-sm h-9 shrink-0'
                />
              </div>
              <div className='mt-5 w-10 h-10'>
                <Checkbox
                  id={`closed-${index}`}
                  checked={hours.isClosed}
                  onCheckedChange={(checked) =>
                    handleWorkingHoursChange(index, 'isClosed', checked as boolean)
                  }
                  className='shrink-0'
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Blocked Dates */}
      <Card>
        <CardHeader>
          <CardTitle>Blocked Dates</CardTitle>
          <CardDescription>Mark days when your restaurant will be closed. Fill in the date and reason, then click + to add.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex gap-2'>
            <Input
              type='date'
              value={newBlockedDate.date}
              onChange={(e) => setNewBlockedDate({ ...newBlockedDate, date: e.target.value })}
              placeholder='Select date'
            />
            <Input
              value={newBlockedDate.reason}
              onChange={(e) => setNewBlockedDate({ ...newBlockedDate, reason: e.target.value })}
              placeholder='Reason (e.g., Holiday)'
            />
            <Button type='button' onClick={addBlockedDate} variant='outline'>
              <Plus className='h-4 w-4' />
            </Button>
          </div>

          {formData.blockedDates.length > 0 && (
            <div className='space-y-2'>
              {formData.blockedDates.map((blocked, index) => (
                <div key={index} className='flex justify-between items-center p-2 border rounded'>
                  <div>
                    <span className='font-medium'>
                      {new Date(blocked.date).toLocaleDateString()}
                    </span>
                    {' - '}
                    <span className='text-muted-foreground'>{blocked.reason}</span>
                  </div>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={() => removeBlockedDate(index)}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employees */}
      <Card>
        <CardHeader>
          <CardTitle>Staff</CardTitle>
          <CardDescription>Manage employee count</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label className='mb-2'>Total Employees *</Label>
            <div className='flex items-center gap-2 mt-2'>
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={() => handleEmployeesChange(false)}
              >
                <Minus className='h-4 w-4' />
              </Button>
              <Input
                type='number'
                min='1'
                value={formData.totalEmployees}
                onChange={(e) => handleNumberChange(e, 'totalEmployees')}
                className='text-center'
              />
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={() => handleEmployeesChange(true)}
              >
                <Plus className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Buttons */}
      <div className='flex gap-4 justify-end'>
        <Button type='button' variant='outline' onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
        <Button type='submit' disabled={loading}>
          {loading ? 'Saving...' : isEdit ? 'Update Restaurant' : 'Create Restaurant'}
        </Button>
      </div>
    </form>
  );
}
