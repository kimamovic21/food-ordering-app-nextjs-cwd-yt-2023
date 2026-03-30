import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type CustomerInfoCardProps = {
  email: string;
  phone: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  country: string;
};

const CustomerInfoCard = ({
  email,
  phone,
  streetAddress,
  postalCode,
  city,
  country,
}: CustomerInfoCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {/* Row 1: Email (full width) */}
          <div>
            <p className='text-sm text-muted-foreground'>Email</p>
            <p className='font-semibold text-foreground'>{email}</p>
          </div>

          {/* Row 2: Phone (full width) */}
          <div>
            <p className='text-sm text-muted-foreground'>Phone</p>
            <p className='font-semibold text-foreground'>{phone}</p>
          </div>

          {/* Row 3 & 4: Address fields in 2-column grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4'>
            <div>
              <p className='text-sm text-muted-foreground'>Street Address</p>
              <p className='font-semibold text-foreground'>{streetAddress}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>City</p>
              <p className='font-semibold text-foreground'>{city}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Postal Code</p>
              <p className='font-semibold text-foreground'>{postalCode}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Country</p>
              <p className='font-semibold text-foreground'>{country}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerInfoCard;
