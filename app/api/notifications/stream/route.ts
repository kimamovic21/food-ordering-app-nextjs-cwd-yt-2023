import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/libs/authOptions';
import { subscribeToNotificationEvents } from '@/libs/notificationEvents';
import { User } from '@/models/user';

const getCurrentUser = async () => {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  return User.findOne({ email }).select('_id').lean();
};

export async function GET() {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  let heartbeatTimer: NodeJS.Timeout | null = null;
  let unsubscribe: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      const currentUserId = currentUser._id.toString();

      send({ type: 'ready' });

      unsubscribe = subscribeToNotificationEvents((event) => {
        if (event.recipientUserId !== currentUserId) {
          return;
        }

        send({
          ...event,
          isIncoming: event.type === 'notification-created',
        });
      });

      heartbeatTimer = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 25000);
    },
    cancel() {
      unsubscribe?.();
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
