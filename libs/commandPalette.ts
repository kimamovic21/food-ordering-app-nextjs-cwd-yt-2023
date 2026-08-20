'use client';

export const APP_COMMAND_PALETTE_OPEN_EVENT = 'app:open-command-palette';

export const openAppCommandPalette = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(APP_COMMAND_PALETTE_OPEN_EVENT));
};
