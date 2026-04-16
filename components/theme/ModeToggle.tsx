'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-slot='button'
          className='relative inline-flex items-center justify-center h-9 w-9 text-foreground hover:text-primary transition-colors cursor-pointer'
        >
          <Sun className='h-[26px] w-[26px] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90' />
          <Moon className='absolute h-[26px] w-[26px] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0' />
          <span className='sr-only'>Toggle theme</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export default ModeToggle;
