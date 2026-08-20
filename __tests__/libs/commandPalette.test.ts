/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from 'vitest';
import { APP_COMMAND_PALETTE_OPEN_EVENT, openAppCommandPalette } from '@/libs/commandPalette';

describe('command palette helper', () => {
  it('dispatches the global command palette open event', () => {
    const listener = vi.fn();
    window.addEventListener(APP_COMMAND_PALETTE_OPEN_EVENT, listener);

    openAppCommandPalette();

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(APP_COMMAND_PALETTE_OPEN_EVENT, listener);
  });
});
