/**
 * @vitest-environment jsdom
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppCommandPalette from '@/components/shared/AppCommandPalette';
import { APP_COMMAND_PALETTE_OPEN_EVENT } from '@/libs/commandPalette';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    status: 'authenticated',
    data: {
      user: {
        role: 'admin',
      },
    },
  }),
}));

vi.mock('@/hooks/useProfile', () => ({
  default: () => ({
    data: {
      role: 'admin',
    },
    loading: false,
  }),
}));

describe('AppCommandPalette', () => {
  beforeEach(() => {
    pushMock.mockClear();
    class ResizeObserverMock {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }

    global.ResizeObserver = ResizeObserverMock;
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('opens from the global event and navigates to selected commands', async () => {
    render(<AppCommandPalette />);

    await act(async () => {
      window.dispatchEvent(new Event(APP_COMMAND_PALETTE_OPEN_EVENT));
    });

    expect(await screen.findByPlaceholderText('Search routes and actions...')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Admin orders'));

    expect(pushMock).toHaveBeenCalledWith('/admin-dashboard/orders');
  });

  it('ignores malformed keyboard events without a key value', () => {
    render(<AppCommandPalette />);

    const eventWithoutKey = new Event('keydown') as KeyboardEvent;
    Object.defineProperty(eventWithoutKey, 'key', { value: undefined });

    expect(() => document.dispatchEvent(eventWithoutKey)).not.toThrow();
    expect(screen.queryByPlaceholderText('Search routes and actions...')).not.toBeInTheDocument();
  });
});
