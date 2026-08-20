import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CommandPaletteTrigger from '@/components/shared/CommandPaletteTrigger';
import { APP_COMMAND_PALETTE_OPEN_EVENT } from '@/libs/commandPalette';

describe('CommandPaletteTrigger', () => {
  it('shows the keyboard shortcut and opens the command palette event', async () => {
    const user = userEvent.setup();
    const listener = vi.fn();

    window.addEventListener(APP_COMMAND_PALETTE_OPEN_EVENT, listener);

    render(<CommandPaletteTrigger />);

    expect(screen.getByText('Ctrl K')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /search app/i }));

    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(APP_COMMAND_PALETTE_OPEN_EVENT, listener);
  });
});
