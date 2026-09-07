import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/libs/authOptions';
import {
  MAX_SAVED_DELIVERY_ADDRESSES,
  normalizeDeliveryAddress,
  serializeDeliveryAddress,
  serializeDeliveryAddresses,
} from '@/libs/deliveryAddresses';
import { mongoConnect } from '@/libs/mongoConnect';
import { User } from '@/models/user';

const getCurrentUser = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }

  return User.findOne({ email: session.user.email });
};

export async function GET() {
  await mongoConnect();

  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return Response.json({
    addresses: serializeDeliveryAddresses(user.deliveryAddresses || []),
  });
}

export async function POST(req: Request) {
  await mongoConnect();

  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const currentAddresses = Array.isArray(user.deliveryAddresses) ? user.deliveryAddresses : [];
  if (currentAddresses.length >= MAX_SAVED_DELIVERY_ADDRESSES) {
    return Response.json(
      { error: `You can save up to ${MAX_SAVED_DELIVERY_ADDRESSES} delivery addresses.` },
      { status: 400 }
    );
  }

  const result = normalizeDeliveryAddress(await req.json().catch(() => null));
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  if (result.address.isDefault || currentAddresses.length === 0) {
    currentAddresses.forEach((address: any) => {
      address.isDefault = false;
    });
    result.address.isDefault = true;
  }

  const newAddress = {
    _id: new mongoose.Types.ObjectId(),
    ...result.address,
  };

  user.deliveryAddresses = currentAddresses;
  user.deliveryAddresses.push(newAddress);
  await user.save();

  const savedAddress = user.deliveryAddresses[user.deliveryAddresses.length - 1];

  return Response.json(
    {
      address: serializeDeliveryAddress(savedAddress),
      addresses: serializeDeliveryAddresses(user.deliveryAddresses || []),
    },
    { status: 201 }
  );
}

export async function PATCH(req: Request) {
  await mongoConnect();

  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const addressId = String(body?.addressId || '');

  if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
    return Response.json({ error: 'Invalid delivery address ID' }, { status: 400 });
  }

  const addresses = Array.isArray(user.deliveryAddresses) ? user.deliveryAddresses : [];
  const address = addresses.find((item: any) => String(item._id) === addressId);

  if (!address) {
    return Response.json({ error: 'Delivery address not found' }, { status: 404 });
  }

  addresses.forEach((item: any) => {
    item.isDefault = String(item._id) === addressId;
  });

  user.deliveryAddresses = addresses;
  await user.save();

  return Response.json({
    address: serializeDeliveryAddress(address),
    addresses: serializeDeliveryAddresses(user.deliveryAddresses || []),
  });
}

export async function DELETE(req: Request) {
  await mongoConnect();

  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const addressId = searchParams.get('addressId') || '';

  if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
    return Response.json({ error: 'Invalid delivery address ID' }, { status: 400 });
  }

  const addresses = Array.isArray(user.deliveryAddresses) ? user.deliveryAddresses : [];
  const addressExists = addresses.some((item: any) => String(item._id) === addressId);

  if (!addressExists) {
    return Response.json({ error: 'Delivery address not found' }, { status: 404 });
  }

  const nextAddresses = addresses.filter((item: any) => String(item._id) !== addressId);
  if (nextAddresses.length > 0 && !nextAddresses.some((item: any) => item.isDefault)) {
    nextAddresses[0].isDefault = true;
  }

  user.deliveryAddresses = nextAddresses;
  await user.save();

  return Response.json({
    addresses: serializeDeliveryAddresses(user.deliveryAddresses || []),
  });
}
