import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/libs/authOptions';
import { User } from '@/models/user';
import { Notification } from '@/models/notification';
import { emitNotificationEvent } from '@/libs/notificationEvents';

const getCurrentUser = async () => {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  return User.findOne({ email }).select('_id role').lean();
};

export async function GET(request: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || 15)));
  const skip = Math.max(0, Number(url.searchParams.get('skip') || 0));
  const unreadOnly = url.searchParams.get('unreadOnly') === 'true';

  const baseFilter: Record<string, unknown> = { recipientUserId: user._id };
  if (unreadOnly) {
    baseFilter.isRead = false;
  }

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(baseFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments({ recipientUserId: user._id, isRead: false }),
  ]);

  return Response.json({ notifications, unreadCount });
}

export async function PATCH(request: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const action = body?.action;

  if (!action || !['mark-read', 'mark-unread', 'mark-all-read'].includes(action)) {
    return Response.json({ error: 'Invalid action' }, { status: 400 });
  }

  if (action === 'mark-all-read') {
    await Notification.updateMany(
      { recipientUserId: user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
  } else {
    const notificationId = body?.notificationId;

    if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
      return Response.json({ error: 'Invalid notification ID' }, { status: 400 });
    }

    const updated = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientUserId: user._id },
      {
        $set: {
          isRead: action === 'mark-read',
          readAt: action === 'mark-read' ? new Date() : null,
        },
      },
      { new: true }
    ).lean();

    if (!updated) {
      return Response.json({ error: 'Notification not found' }, { status: 404 });
    }
  }

  const unreadCount = await Notification.countDocuments({
    recipientUserId: user._id,
    isRead: false,
  });

  emitNotificationEvent({
    type: 'notifications-read',
    recipientUserId: user._id.toString(),
    unreadCount,
  });

  return Response.json({ success: true, unreadCount });
}
