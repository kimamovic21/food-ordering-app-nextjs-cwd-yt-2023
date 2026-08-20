'use client';

import { Search } from 'lucide-react';
import { openAppCommandPalette } from '@/libs/commandPalette';
import { cn } from '@/libs/utils';

type CommandPaletteTriggerProps = {
  className?: string;
  label?: string;
  showLabel?: boolean;
  onOpen?: () => void;
};

const CommandPaletteTrigger = ({
  className,
  label = 'Search app',
  showLabel = true,
  onOpen,
}: CommandPaletteTriggerProps) => {
  const handleClick = () => {
    onOpen?.();
    openAppCommandPalette();
  };

  return (
    <button
      data-slot='button'
      type='button'
      onClick={handleClick}
      aria-label={`${label}. Shortcut: Ctrl K or Command K`}
      title={`${label} (Ctrl/Cmd + K)`}
      className={cn(
        'inline-flex h-10 min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 text-sm font-medium text-foreground transition hover:border-primary/50 hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        className
      )}
    >
      <Search className='size-4 shrink-0' />
      {showLabel && <span className='truncate'>{label}</span>}
      <kbd className='ml-auto shrink-0 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none text-muted-foreground'>
        Ctrl K
      </kbd>
    </button>
  );
};

export default CommandPaletteTrigger;
