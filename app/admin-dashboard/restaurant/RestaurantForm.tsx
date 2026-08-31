'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
import { MapPin, Plus, Minus, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import dynamic from 'next/dynamic';
import RestaurantImagesUpload, { ImageItem } from './RestaurantImagesUpload';
import { formatAppDate } from '@/libs/dateFormat';
import type { RestaurantFormData, RestaurantWorkingHour } from '@/types/restaurant';

const RestaurantLocation = dynamic(() => import('@/components/shared/RestaurantLocation'), {
  ssr: false,
  loading: () => <div className='h-[400px] bg-muted animate-pulse rounded-lg' />,
});

interface RestaurantFormProps {
  restaurant?: RestaurantFormData;
  isEdit?: boolean;
}

const defaultWorkingHours: RestaurantWorkingHour[] = [
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
    minimumOrderAmount: restaurant.minimumOrderAmount ?? 10,
    averagePreparationMinutes: restaurant.averagePreparationMinutes ?? 25,
    averageDeliveryMinutes: restaurant.averageDeliveryMinutes ?? 20,
    activeOrderLimit: restaurant.activeOrderLimit ?? 10,
    deliveryRadiusKm: restaurant.deliveryRadiusKm ?? 10,
    isPaused: restaurant.isPaused ?? false,
    pauseReason: restaurant.pauseReason ?? '',
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

const RestaurantForm = ({ restaurant, isEdit = false }: RestaurantFormProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);

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
    minimumOrderAmount: 10,
    averagePreparationMinutes: 25,
    averageDeliveryMinutes: 20,
    activeOrderLimit: 10,
    deliveryRadiusKm: 10,
    isPaused: false,
    pauseReason: '',
    workingHours: defaultWorkingHours,
    blockedDates: [],
    totalEmployees: 1,
    images: [],
    ...formattedRestaurant,
  });

  // Track image items (both existing URLs and new files with previews)
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);

  // Track original images to know which to delete
  const [originalImages, setOriginalImages] = useState<string[]>([]);

  // Initialize image items from existing restaurant data
  useEffect(() => {
    if (formattedRestaurant?.images && formattedRestaurant.images.length > 0) {
      const items: ImageItem[] = formattedRestaurant.images.map((url, index) => ({
        id: `existing-${index}-${url}`,
        type: 'url' as const,
        url,
      }));
      setImageItems(items);
      setOriginalImages(formattedRestaurant.images);
    }
  }, [restaurant, formattedRestaurant?.images]);

  const [newBlockedDate, setNewBlockedDate] = useState({ date: '', reason: '' });

  const handleImageItemsChange = (newItems: ImageItem[]) => {
    setImageItems(newItems);
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
      minimumOrderAmount: data.minimumOrderAmount,
      averagePreparationMinutes: data.averagePreparationMinutes,
      averageDeliveryMinutes: data.averageDeliveryMinutes,
      activeOrderLimit: data.activeOrderLimit,
      deliveryRadiusKm: data.deliveryRadiusKm,
      isPaused: data.isPaused,
      pauseReason: data.pauseReason,
      workingHours: data.workingHours,
      blockedDates: data.blockedDates
        .map((blocked) => {
          const isoDate = toIsoDate(blocked.date);
          return {
            date: isoDate,
            reason: (blocked.reason || '').trim(),
          };
        })
        .filter((blocked) => {
          const isValid = Boolean(blocked.date && blocked.reason);
          return isValid;
        }),
      totalEmployees: data.totalEmployees,
      images: data.images,
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
      sonnerToast.error('Geolocation is not supported by your browser');
      return;
    }

    sonnerToast.loading('Getting your location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        sonnerToast.dismiss();
        sonnerToast.success('Location updated successfully', {
          style: {
            backgroundColor: 'rgb(22 163 74)',
            color: '#fff',
            borderColor: 'rgb(22 163 74)',
          },
        });
      },
      (error) => {
        sonnerToast.dismiss();
        sonnerToast.error('Failed to get location: ' + error.message);
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
      sonnerToast.error('Please fill in both date and reason');
      return;
    }

    const normalizedDate = toIsoDate(newBlockedDate.date);

    if (!normalizedDate) {
      sonnerToast.error('Please enter a valid date');
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
    sonnerToast.success('Blocked date added');
  };

  const removeBlockedDate = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      blockedDates: prev.blockedDates.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      sonnerToast.error('Restaurant name is required');
      return false;
    }
    if (!formData.street.trim()) {
      sonnerToast.error('Street address is required');
      return false;
    }
    if (!formData.city.trim()) {
      sonnerToast.error('City is required');
      return false;
    }
    if (!formData.postalCode.trim()) {
      sonnerToast.error('Postal code is required');
      return false;
    }
    if (!formData.country.trim()) {
      sonnerToast.error('Country is required');
      return false;
    }
    if (!formData.latitude || !formData.longitude) {
      sonnerToast.error(
        'Location coordinates are required. Please use "Get Current Location" button'
      );
      return false;
    }
    if (!formData.contact.trim()) {
      sonnerToast.error('Contact number is required');
      return false;
    }
    if (!formData.email.trim()) {
      sonnerToast.error('Email is required');
      return false;
    }
    if (!formData.description.trim()) {
      sonnerToast.error('Description is required');
      return false;
    }
    if (formData.description.length < 20 || formData.description.length > 200) {
      sonnerToast.error('Description must be between 20 and 200 characters');
      return false;
    }
    if (formData.averagePreparationMinutes < 0 || formData.averagePreparationMinutes > 240) {
      sonnerToast.error('Average preparation time must be between 0 and 240 minutes');
      return false;
    }
    if (formData.minimumOrderAmount < 1 || formData.minimumOrderAmount > 100) {
      sonnerToast.error('Minimum order amount must be between $1 and $100');
      return false;
    }
    if (formData.averageDeliveryMinutes < 0 || formData.averageDeliveryMinutes > 240) {
      sonnerToast.error('Average delivery time must be between 0 and 240 minutes');
      return false;
    }
    if (formData.activeOrderLimit < 1 || formData.activeOrderLimit > 100) {
      sonnerToast.error('Active order limit must be between 1 and 100 orders');
      return false;
    }
    if (formData.deliveryRadiusKm < 1 || formData.deliveryRadiusKm > 15) {
      sonnerToast.error('Delivery radius must be between 1 and 15 km');
      return false;
    }
    if (formData.pauseReason.length > 160) {
      sonnerToast.error('Pause reason must be 160 characters or less');
      return false;
    }
    // Check images validation
    if (!imageItems || imageItems.length === 0) {
      sonnerToast.error('At least one restaurant image is required');
      return false;
    }
    if (imageItems.length > 5) {
      sonnerToast.error('Maximum 5 images allowed');
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
    let shouldDismissToast = true;

    try {
      setLoading(true);
      setIsSavingImage(true);

      const isCreating = !isEdit;
      creatingToastId = isCreating
        ? sonnerToast.loading('Creating restaurant please wait...')
        : sonnerToast.loading('Updating restaurant please wait...');

      // Step 1: Upload new files to Cloudinary
      const uploadedUrls: string[] = [];
      const existingUrls: string[] = [];

      for (const item of imageItems) {
        if (item.type === 'file' && item.file) {
          // Upload new file
          const formDataToSend = new FormData();
          formDataToSend.append('file', item.file);

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

          uploadedUrls.push(data.url);
        } else if (item.type === 'url') {
          // Keep existing URL
          existingUrls.push(item.url);
        }
      }

      // Step 2: Determine which original images were removed and delete them from Cloudinary
      if (isEdit) {
        const currentUrls = existingUrls;
        const removedUrls = originalImages.filter((url) => !currentUrls.includes(url));

        for (const removedUrl of removedUrls) {
          try {
            await fetch('/api/upload/restaurants', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ imageUrl: removedUrl }),
            });
          } catch (error) {
            console.error('Error deleting removed image:', error);
            // Continue even if deletion fails
          }
        }
      }

      // Step 3: Build final images array (maintain order from imageItems)
      const finalImages: string[] = [];
      for (const item of imageItems) {
        if (item.type === 'file') {
          // Find the uploaded URL for this file (match by order)
          const uploadedUrl = uploadedUrls.shift();
          if (uploadedUrl) {
            finalImages.push(uploadedUrl);
          }
        } else {
          finalImages.push(item.url);
        }
      }

      // Step 4: Submit the form with final images
      const method = isEdit ? 'PUT' : 'POST';
      const payload = buildPayload({ ...formData, images: finalImages }, isEdit);

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

      if (creatingToastId) {
        sonnerToast.success(
          isCreating ? 'Restaurant created successfully' : 'Restaurant updated successfully',
          {
            id: creatingToastId,
            style: {
              backgroundColor: 'rgb(22 163 74)',
              color: '#fff',
              borderColor: 'rgb(22 163 74)',
            },
          }
        );
        shouldDismissToast = false;
      }

      router.push('/admin-dashboard/restaurant');
    } catch (error: any) {
      console.error('Error submitting form:', error);
      sonnerToast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} restaurant`);
    } finally {
      if (creatingToastId && shouldDismissToast) {
        sonnerToast.dismiss(creatingToastId);
      }
      setLoading(false);
      setIsSavingImage(false);
    }
  };

  const getDayLabel = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  return (
    <form onSubmit={handleSubmit} className='min-w-0 space-y-6'>
      {/* Row 1: Basic Information & Contact Information */}
      <div className='grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2'>
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
                  <RestaurantLocation
                    name={formData.name}
                    address={`${formData.street}, ${formData.city} ${formData.postalCode}, ${formData.country}`}
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Row 2b: Restaurant Images */}
      <Card>
        <CardHeader>
          <CardTitle>Restaurant Images</CardTitle>
          <CardDescription>
            Upload up to 5 high-quality images of your restaurant. First image will be the cover
            photo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RestaurantImagesUpload
            imageItems={imageItems}
            onImageItemsChange={handleImageItemsChange}
            isSaving={isSavingImage}
            maxImages={5}
          />
        </CardContent>
      </Card>

      {/* Row 3: Pricing & Fees & Staff */}
      <div className='grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2'>
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
              <Label htmlFor='minimumOrderAmount' className='mb-2'>
                Minimum Order Amount *
              </Label>
              <div className='flex items-center gap-2'>
                <span className='text-sm text-muted-foreground'>$</span>
                <Input
                  id='minimumOrderAmount'
                  type='number'
                  min='1'
                  max='100'
                  step='1'
                  value={formData.minimumOrderAmount}
                  onChange={(e) => handleNumberChange(e, 'minimumOrderAmount')}
                  required
                />
              </div>
              <p className='mt-1 text-xs text-muted-foreground'>
                Checkout is blocked when the food subtotal is below this amount.
              </p>
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

            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <Label htmlFor='averagePreparationMinutes' className='mb-2'>
                  Average Preparation *
                </Label>
                <div className='flex items-center gap-2'>
                  <Input
                    id='averagePreparationMinutes'
                    type='number'
                    min='0'
                    max='240'
                    step='1'
                    value={formData.averagePreparationMinutes}
                    onChange={(e) => handleNumberChange(e, 'averagePreparationMinutes')}
                    required
                  />
                  <span className='text-sm text-muted-foreground'>min</span>
                </div>
              </div>

              <div>
                <Label htmlFor='averageDeliveryMinutes' className='mb-2'>
                  Average Delivery *
                </Label>
                <div className='flex items-center gap-2'>
                  <Input
                    id='averageDeliveryMinutes'
                    type='number'
                    min='0'
                    max='240'
                    step='1'
                    value={formData.averageDeliveryMinutes}
                    onChange={(e) => handleNumberChange(e, 'averageDeliveryMinutes')}
                    required
                  />
                  <span className='text-sm text-muted-foreground'>min</span>
                </div>
              </div>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <Label htmlFor='activeOrderLimit' className='mb-2'>
                  Active Order Limit *
                </Label>
                <div className='flex items-center gap-2'>
                  <Input
                    id='activeOrderLimit'
                    type='number'
                    min='1'
                    max='100'
                    step='1'
                    value={formData.activeOrderLimit}
                    onChange={(e) => handleNumberChange(e, 'activeOrderLimit')}
                    required
                  />
                  <span className='text-sm text-muted-foreground'>orders</span>
                </div>
                <p className='mt-1 text-xs text-muted-foreground'>
                  Checkout pauses when paid kitchen orders reach this limit.
                </p>
              </div>

              <div>
                <Label htmlFor='deliveryRadiusKm' className='mb-2'>
                  Delivery Radius *
                </Label>
                <div className='flex items-center gap-2'>
                  <Input
                    id='deliveryRadiusKm'
                    type='number'
                    min='1'
                    max='15'
                    step='0.5'
                    value={formData.deliveryRadiusKm}
                    onChange={(e) => handleNumberChange(e, 'deliveryRadiusKm')}
                    required
                  />
                  <span className='text-sm text-muted-foreground'>km</span>
                </div>
                <p className='mt-1 text-xs text-muted-foreground'>
                  10 km is recommended; 15 km is the maximum allowed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ordering Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Ordering Controls</CardTitle>
            <CardDescription>
              Pause checkout temporarily when the kitchen is overloaded
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <label
              htmlFor='isPaused'
              className='flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/40'
            >
              <Checkbox
                id='isPaused'
                checked={formData.isPaused}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isPaused: checked === true }))
                }
                className='mt-1'
              />
              <span>
                <span className='block font-medium'>Pause new orders</span>
                <span className='text-sm text-muted-foreground'>
                  Customers can browse your menu, but checkout is blocked while this is enabled.
                </span>
              </span>
            </label>

            <div>
              <Label htmlFor='pauseReason' className='mb-2'>
                Pause Reason
              </Label>
              <Textarea
                id='pauseReason'
                name='pauseReason'
                value={formData.pauseReason}
                onChange={handleInputChange}
                placeholder='Example: Kitchen is catching up on current orders.'
                maxLength={160}
                rows={3}
              />
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
      <div className='grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Working Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Working Hours</CardTitle>
            <CardDescription>Set your restaurant&apos;s operating hours</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {/* Header Row */}
            <div className='hidden items-center gap-2 border-b-2 pb-2 sm:flex'>
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
              <div
                key={index}
                className='flex flex-col gap-3 border-b py-3 last:border-0 sm:flex-row sm:items-center sm:gap-2 sm:py-2'
              >
                <div className='w-20 shrink-0 text-sm font-medium'>{getDayLabel(hours.day)}</div>
                <div className='flex min-w-0 flex-1 flex-wrap items-center gap-2'>
                  <Input
                    type='time'
                    value={hours.openTime}
                    onChange={(e) => handleWorkingHoursChange(index, 'openTime', e.target.value)}
                    disabled={hours.isClosed}
                    className='h-9 w-24 shrink-0 text-sm'
                  />
                  <span className='text-xs text-muted-foreground shrink-0'>-</span>
                  <Input
                    type='time'
                    value={hours.closeTime}
                    onChange={(e) => handleWorkingHoursChange(index, 'closeTime', e.target.value)}
                    disabled={hours.isClosed}
                    className='h-9 w-24 shrink-0 text-sm'
                  />
                </div>
                <label
                  htmlFor={`closed-${index}`}
                  className='flex h-10 w-fit items-center gap-2 text-xs text-muted-foreground sm:mt-5 sm:w-10 sm:justify-center'
                >
                  <Checkbox
                    id={`closed-${index}`}
                    checked={hours.isClosed}
                    onCheckedChange={(checked) =>
                      handleWorkingHoursChange(index, 'isClosed', checked as boolean)
                    }
                    className='shrink-0'
                  />
                  <span className='sm:hidden'>Closed</span>
                </label>
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
            <div className='grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]'>
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
                      <span className='font-medium'>{formatAppDate(blocked.date)}</span>
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
};

export default RestaurantForm;
