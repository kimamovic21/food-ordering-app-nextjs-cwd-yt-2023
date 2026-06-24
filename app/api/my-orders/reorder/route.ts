import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { createAuditLog } from '@/libs/auditLog';
import { MenuItem } from '@/models/menuItem';
import { Order } from '@/models/order';
import { User } from '@/models/user';

type CartSize = 'small' | 'medium' | 'large' | 'single';

const normalizeSize = (value: unknown, priceType?: string): CartSize => {
  const size = String(value || '').toLowerCase();

  if (priceType === 'single') return 'single';
  if (size.includes('large')) return 'large';
  if (size.includes('medium')) return 'medium';
  if (size.includes('small')) return 'small';

  return 'single';
};

const getMenuItemPrice = (menuItem: any, size: CartSize, fallbackPrice: number) => {
  if (size === 'large' && typeof menuItem.priceLarge === 'number') return menuItem.priceLarge;
  if (size === 'medium' && typeof menuItem.priceMedium === 'number') return menuItem.priceMedium;
  if (
    (size === 'small' || size === 'single') &&
    typeof menuItem.priceSmall === 'number' &&
    menuItem.priceSmall > 0
  ) {
    return menuItem.priceSmall;
  }

  return fallbackPrice;
};

export async function POST(request: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const { orderId } = (await request.json()) as { orderId?: string };

  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    return Response.json({ error: 'Invalid order ID' }, { status: 400 });
  }

  const order = await Order.findOne({ _id: orderId, userId: user._id }).lean();
  if (!order) {
    return Response.json({ error: 'Order not found' }, { status: 404 });
  }

  const cartProducts = Array.isArray(order.cartProducts) ? order.cartProducts : [];
  if (cartProducts.length === 0) {
    return Response.json({ error: 'This order has no menu items to reorder' }, { status: 400 });
  }

  const productIds = cartProducts
    .map((item: any) => item.productId?.toString?.() || String(item.productId || ''))
    .filter((id: string) => mongoose.Types.ObjectId.isValid(id));

  if (productIds.length !== cartProducts.length) {
    return Response.json({ error: 'This order contains invalid menu items' }, { status: 400 });
  }

  const menuItems = await MenuItem.find({ _id: { $in: productIds } })
    .select(
      '_id name description image priceType priceSmall priceMedium priceLarge restaurantId isAvailable'
    )
    .lean();
  const menuItemsById = new Map(menuItems.map((item: any) => [item._id.toString(), item]));

  let cartItems: {
    _id: string;
    name: string;
    description: string;
    image: string;
    size: CartSize;
    price: number;
    quantity: number;
    restaurantId: string;
  }[];

  try {
    cartItems = cartProducts.map((product: any) => {
      const productId = product.productId?.toString?.() || String(product.productId || '');
      const menuItem = menuItemsById.get(productId);

      if (!menuItem) {
        throw new Error(`${product.name || 'A menu item'} is no longer available.`);
      }

      if (menuItem.isAvailable === false) {
        throw new Error(
          `${menuItem.name || product.name || 'A menu item'} is currently unavailable.`
        );
      }

      const size = normalizeSize(product.size, menuItem.priceType);
      const price = getMenuItemPrice(menuItem, size, Number(product.price) || 0);

      return {
        _id: menuItem._id.toString(),
        name: menuItem.name,
        description: menuItem.description || '',
        image: menuItem.image || '',
        size,
        price,
        quantity: Math.max(1, Number(product.quantity) || 1),
        restaurantId: menuItem.restaurantId?.toString?.() || String(menuItem.restaurantId || ''),
      };
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to reorder this order.' },
      { status: 400 }
    );
  }

  const restaurantIds = new Set(cartItems.map((item) => item.restaurantId));
  if (restaurantIds.size > 1) {
    return Response.json(
      { error: 'This order cannot be reordered because it contains multiple restaurants.' },
      { status: 400 }
    );
  }

  await createAuditLog({
    actor: user,
    action: 'order.reordered',
    entityType: 'order',
    entityId: order._id,
    restaurantId: cartItems[0]?.restaurantId,
    orderId: order._id,
    metadata: { itemCount: cartItems.length },
  });

  return Response.json({ cartItems });
}
