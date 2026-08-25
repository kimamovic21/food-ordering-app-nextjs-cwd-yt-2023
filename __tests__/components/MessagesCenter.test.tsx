/**

- @vitest-environment jsdom
  */

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MessagesCenter from '@/components/shared/MessagesCenter';

const navigationMock = vi.hoisted(() => ({
  params: {} as { participantId?: string },
  push: vi.fn(),
  searchParams: new URLSearchParams('participantId=recipient-1&context=direct'),
}));

vi.mock('next/navigation', () => ({
  useParams: () => navigationMock.params,
  useRouter: () => ({
    push: navigationMock.push,
  }),
  useSearchParams: () => navigationMock.searchParams,
}));

vi.mock('@/hooks/useProfile', () => ({
  default: () => ({
    data: {
      _id: 'current-user-1',
      role: 'admin',
    },
    loading: false,
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const MessagesCenterTestWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return MessagesCenterTestWrapper;
};

describe('MessagesCenter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    navigationMock.params = {};
    navigationMock.push.mockClear();
    navigationMock.searchParams = new URLSearchParams('participantId=recipient-1&context=direct');
  });

  it('loads and renders an inline conversation through TanStack Query', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();

      if (url.startsWith('/api/messages')) {
        return Response.json({
          conversations: [],
          unreadCount: 0,
          contactSuggestions: [
            {
              _id: 'recipient-1',
              href: '/messages?participantId=recipient-1&context=direct',
              name: 'John Courier',
              role: 'courier',
            },
          ],
          contactPage: 1,
          contactHasMore: false,
          selectedConversation: {
            conversation: null,
            contact: {
              _id: 'recipient-1',
              href: '/messages?participantId=recipient-1&context=direct',
              name: 'John Courier',
              role: 'courier',
            },
            contextType: 'direct',
            messages: [],
            orderId: null,
          },
        });
      }

      return Response.json({}, { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<MessagesCenter title='Messages' description='Open approved conversations.' />, {
      wrapper: createWrapper(),
    });

    expect((await screen.findAllByText('John Courier')).length).toBeGreaterThan(0);
    expect(screen.getByText('Start the conversation')).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/messages?participantId=recipient-1&context=direct',
        { cache: 'no-store' }
      );
    });
  });
});
