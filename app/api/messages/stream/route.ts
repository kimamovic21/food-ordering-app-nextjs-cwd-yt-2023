import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/libs/authOptions';
import { User } from '@/models/user';
import { subscribeToMessageEvents } from '@/libs/messageEvents';

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

      send({ type: 'ready' });

      unsubscribe = subscribeToMessageEvents((event) => {
        const currentUserId = currentUser._id.toString();
        if (event.senderUserId === currentUserId || event.recipientUserId === currentUserId) {
          send({
            ...event,
            isIncoming: event.recipientUserId === currentUserId,
          });
        }
      });

      heartbeatTimer = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 25000);

      const close = () => {
        unsubscribe?.();
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
        }
      };

      (controller as any).__cleanup = close;
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
