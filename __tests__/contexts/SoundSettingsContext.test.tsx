/**
 * @vitest-environment jsdom
 */

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SoundSettingsProvider, useSoundSettings } from '@/contexts/SoundSettingsContext';

const sessionMock = vi.hoisted(() => ({
  status: 'authenticated' as 'authenticated' | 'unauthenticated' | 'loading',
}));

vi.mock('next-auth/react', () => ({
  useSession: () => sessionMock,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
      queries: {
        retry: false,
      },
    },
  });

  const QuerySoundSettingsTestWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SoundSettingsProvider>{children}</SoundSettingsProvider>
    </QueryClientProvider>
  );

  return QuerySoundSettingsTestWrapper;
};

const SoundSettingsConsumer = () => {
  const { notificationSoundEnabled, messageSoundEnabled, loading, updateNotificationSoundEnabled } =
    useSoundSettings();

  return (
    <>
      <p data-testid='sound-state'>
        {loading ? 'loading' : `${notificationSoundEnabled}:${messageSoundEnabled}`}
      </p>
      <button type='button' onClick={() => void updateNotificationSoundEnabled(false)}>
        Disable notification sound
      </button>
    </>
  );
};

describe('SoundSettingsProvider', () => {
  beforeEach(() => {
    sessionMock.status = 'authenticated';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads notification and message sound settings through TanStack Query', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();

      if (url.includes('/api/notifications/settings')) {
        return Response.json({ notificationSoundEnabled: true });
      }

      if (url.includes('/api/messages/settings')) {
        return Response.json({ messageSoundEnabled: false });
      }

      return Response.json({}, { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const Wrapper = createWrapper();

    render(<SoundSettingsConsumer />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('sound-state')).toHaveTextContent('true:false');
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/notifications/settings', { cache: 'no-store' });
    expect(fetchMock).toHaveBeenCalledWith('/api/messages/settings', { cache: 'no-store' });
  });

  it('optimistically updates notification sound settings and persists them', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();

      if (init?.method === 'PATCH' && url.includes('/api/notifications/settings')) {
        return Response.json({ success: true, notificationSoundEnabled: false });
      }

      if (url.includes('/api/notifications/settings')) {
        return Response.json({ notificationSoundEnabled: true });
      }

      if (url.includes('/api/messages/settings')) {
        return Response.json({ messageSoundEnabled: false });
      }

      return Response.json({}, { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const Wrapper = createWrapper();

    render(<SoundSettingsConsumer />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('sound-state')).toHaveTextContent('true:false');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Disable notification sound' }));

    await waitFor(() => {
      expect(screen.getByTestId('sound-state')).toHaveTextContent('false:false');
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/notifications/settings', {
      body: JSON.stringify({ notificationSoundEnabled: false }),
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
    });
  });
});
