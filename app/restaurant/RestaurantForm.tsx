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
import Image from 'next/image';
import dynamic from 'next/dynamic';
import RestaurantImageUpload from './RestaurantImageUpload';

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
  image: string;
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

const formatRestaurantDataForForm = (restaurant: RestaurantFormData | undefined) => {
  if (!restaurant) return undefined;

  const blockedDates = Array.isArray(restaurant.blockedDates) ? restaurant.blockedDates : [];

  return {
    ...restaurant,
    blockedDates: blockedDates.map((bd) => {
      const date = new Date(bd.date);
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return {
        ...bd,
        date: `${year}-${month}-${day}`,
      };
    }),
  };
};

export default function RestaurantForm({ restaurant, isEdit = false }: RestaurantFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isRemovingImage, setIsRemovingImage] = useState(false);

  const formattedRestaurant = formatRestaurantDataForForm(restaurant);

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
    image: '',
    ...formattedRestaurant,
  });

  const [newBlockedDate, setNewBlockedDate] = useState({ date: '', reason: '' });

  const handleSelectImage = (file: File) => {
    setSelectedImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setIsRemovingImage(true);
  };

  const uploadImage = async () => {
    if (!selectedImageFile) return;

    try {
      setIsSavingImage(true);
      const formDataToSend = new FormData();
      formDataToSend.append('file', selectedImageFile);

      const response = await fetch('/api/upload/restaurants', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      if (!data.url) {
        throw new Error('Upload completed but no image URL was returned');
      }

      setFormData((prev) => ({ ...prev, image: data.url }));
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
      toast.success('Restaurant created successfully', {
        className: 'bg-emerald-600 text-white border-emerald-600',
      });
      return data.url;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
      throw error;
    } finally {
      setIsSavingImage(false);
    }
  };

  const deleteImage = async () => {
    try {
      setIsSavingImage(true);
      const response = await fetch('/api/upload/restaurants', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: formData.image }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete image');
      }

      setFormData((prev) => ({ ...prev, image: '' }));
      setIsRemovingImage(false);
      toast.success('Image removed successfully');
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast.error(error.message || 'Failed to delete image');
      throw error;
    } finally {
      setIsSavingImage(false);
    }
  };

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
          return {
            date: isoDate,
            reason: blocked.reason.trim(),
          };
        })
        .filter((blocked) => {
          const isValid = Boolean(blocked.date && blocked.reason);
          return isValid;
        }),
      totalEmployees: data.totalEmployees,
      image: data.image,
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
        toast.success('Location updated successfully', {
          className: 'bg-emerald-600 text-white border-emerald-600',
        });
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

    if (!normalizedDate) {
      toast.error('Please enter a valid date');
      return;
    }

    setFormData((prev) => {
      const newBlockedDates = [
        ...prev.blockedDates,
        { date: normalizedDate, reason: newBlockedDate.reason.trim() },
      ];
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
    // Check image validation
    // If removing image, we can't save without one (image is always required now)
    if (isRemovingImage && !selectedImageFile) {
      toast.error(
        'Restaurant must have an image. Please upload a new image before removing the current one.'
      );
      return false;
    }
    // If no image exists and not selecting a new one, error
    if (!formData.image && !selectedImageFile) {
      toast.error('Restaurant image is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    let creatingToastId: string | number | undefined;

    try {
      setLoading(true);

      const isCreating = !isEdit;
      creatingToastId = isCreating
        ? toast.loading('Creating restaurant please wait...')
        : undefined;

      let imageUrl = formData.image;

      // Upload new image if selected (edit flow replaces image on the server)
      if (selectedImageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
          setFormData((prev) => ({ ...prev, image: uploadedUrl }));
        }
      }

      // Only delete image if explicitly removing without replacement
      if (isRemovingImage && !selectedImageFile) {
        await deleteImage();
        imageUrl = '';
      }

      const method = isEdit ? 'PUT' : 'POST';
      const payload = buildPayload({ ...formData, image: imageUrl }, isEdit);

      const response = await fetch('/api/restaurant', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${isEdit ? 'update' : 'create'} restaurant`);
      }

      // Reset image states after successful submission
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
      setIsRemovingImage(false);

      if (creatingToastId) {
        toast.success('Restaurant created successfully', {
          id: creatingToastId,
          className: 'bg-emerald-600 text-white border-emerald-600',
        });
      } else {
        toast.success('Restaurant updated successfully', {
          className: 'bg-emerald-600 text-white border-emerald-600',
        });
      }
      router.push('/restaurant');
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} restaurant`);
    } finally {
      if (creatingToastId) {
        toast.dismiss(creatingToastId);
      }
      setLoading(false);
    }
  };

  const getDayLabel = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* Row 1: Basic Information & Contact Information */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
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
      </div>

      {/* Row 2: Location */}
      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
          <CardDescription>Enter your restaurant&apos;s location details</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Location Form - Left Side */}
            <div className='space-y-4'>
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

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
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

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
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

              <Button
                type='button'
                onClick={getCurrentLocation}
                variant='outline'
                className='w-full'
              >
                <MapPin className='h-4 w-4 mr-2' />
                Get Current Location
              </Button>
            </div>

            {/* Location Map - Right Side */}
            {formData.latitude !== 0 && formData.longitude !== 0 && (
              <div>
                <Label className='mb-2 block'>Map Preview</Label>
                <div className='h-[400px] rounded-lg overflow-hidden'>
                  <OrderMap
                    address={formData.street}
                    city={formData.city}
                    postalCode={formData.postalCode}
                    country={formData.country}
                    shouldFetchCourier={false}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Row 2b: Restaurant Image */}
      <Card>
        <CardHeader>
          <CardTitle>Restaurant Image</CardTitle>
          <CardDescription>Upload a high-quality image of your restaurant *</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Upload Controls - Left Side */}
            <div className='space-y-4'>
              <RestaurantImageUpload
                imageUrl={formData.image}
                previewUrl={imagePreviewUrl}
                isRemovingImage={isRemovingImage}
                onSelectImage={handleSelectImage}
                onRemoveImage={handleRemoveImage}
                isSaving={isSavingImage}
                isRequired={!isEdit}
              />
            </div>

            {/* Image Preview - Right Side */}
            {formData.image && !imagePreviewUrl && !isRemovingImage && (
              <div className='flex flex-col items-center justify-center'>
                <Label className='mb-4 text-sm font-medium'>Current Image</Label>
                <div className='relative w-full h-64 rounded-lg overflow-hidden bg-muted/30'>
                  <Image
                    src={formData.image}
                    alt='Restaurant preview'
                    fill
                    className='object-cover'
                  />
                </div>
              </div>
            )}

            {imagePreviewUrl && (
              <div className='flex flex-col items-center justify-center'>
                <Label className='mb-4 text-sm font-medium'>Preview</Label>
                <div className='relative w-full h-64 rounded-lg overflow-hidden bg-muted/30'>
                  <Image
                    src={imagePreviewUrl}
                    alt='Restaurant preview'
                    fill
                    className='object-cover'
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Row 3: Pricing & Fees & Staff */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
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

        {/* Staff */}
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
      </div>

      {/* Row 4: Working Hours & Blocked Dates */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
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
                <div className='w-24 text-xs font-semibold text-muted-foreground shrink-0'>
                  Start Time
                </div>
                <span className='text-xs shrink-0 invisible'>-</span>
                <div className='w-24 text-xs font-semibold text-muted-foreground shrink-0'>
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
                    className='w-24 text-sm h-9 shrink-0'
                  />
                  <span className='text-xs text-muted-foreground shrink-0'>-</span>
                  <Input
                    type='time'
                    value={hours.closeTime}
                    onChange={(e) => handleWorkingHoursChange(index, 'closeTime', e.target.value)}
                    disabled={hours.isClosed}
                    className='w-24 text-sm h-9 shrink-0'
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
            <CardDescription>Mark days when your restaurant will be closed</CardDescription>
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
              <Button type='button' onClick={addBlockedDate} variant='outline' size='icon'>
                <Plus className='h-4 w-4' />
              </Button>
            </div>

            {formData.blockedDates.length > 0 && (
              <div className='space-y-2 max-h-[300px] overflow-y-auto'>
                {formData.blockedDates.map((blocked, index) => (
                  <div key={index} className='flex justify-between items-center p-2 border rounded'>
                    <div className='flex-1'>
                      <span className='font-medium'>
                        {new Date(blocked.date).toLocaleDateString('en-GB')}
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
      </div>

      {/* Submit Buttons */}
      <div className='flex gap-4 justify-end pt-4'>
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
