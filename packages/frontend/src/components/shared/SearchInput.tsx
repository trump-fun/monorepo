import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export function SearchInput({
  placeholder = 'Search...',
  value,
  onChange,
  className = '',
}: SearchInputProps) {
  return (
    <div className='relative'>
      <Search
        className='absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-500 dark:text-gray-400'
        size={18}
      />
      <Input
        placeholder={placeholder}
        className={`border-gray-300 bg-white pl-10 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white ${className}`}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
