'use client';

import { SearchIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const SearchInput = ({ value, onChange, onSearch, onClear, onKeyPress }: SearchInputProps) => {
  return (
    <div className='relative'>
      <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50'>
        <SearchIcon className='size-4' />
        <span className='sr-only'>Search</span>
      </div>
      <Input
        type='search'
        placeholder='Search for menu items...'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={onKeyPress}
        className='peer h-11 px-9 pr-20 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none'
      />
      {value && (
        <Button
          onClick={onClear}
          variant='ghost'
          size='icon'
          className='text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-10 h-full rounded-l-none hover:bg-transparent'
          type='button'
        >
          <X className='size-4' />
          <span className='sr-only'>Clear search</span>
        </Button>
      )}
      <Button
        onClick={onSearch}
        variant='ghost'
        size='icon'
        className='text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 h-full rounded-l-none hover:bg-transparent'
        type='button'
      >
        <SearchIcon className='size-4' />
        <span className='sr-only'>Search</span>
      </Button>
    </div>
  );
};

export default SearchInput;
