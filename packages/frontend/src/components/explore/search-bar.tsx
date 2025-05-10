import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { memo } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  'aria-label'?: string;
}

// Memo to prevent unnecessary re-renders
export const SearchBar = memo(function SearchBar({
  value,
  onChange,
  className = '',
  'aria-label': ariaLabel = 'Search predictions',
}: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <Search
        className='absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-500 dark:text-gray-400'
        size={18}
        aria-hidden='true'
      />
      <Input
        placeholder='Search predictions...'
        className='border-gray-300 bg-white pl-10 text-gray-900 focus:border-orange-500 focus:ring-orange-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-orange-400 dark:focus:ring-orange-400'
        value={value}
        onChange={onChange}
        type='search'
        aria-label={ariaLabel}
      />
    </div>
  );
});
