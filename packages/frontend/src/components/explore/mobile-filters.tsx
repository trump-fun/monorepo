import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Define filter types to match the sidebar options
type FilterType = 'newest' | 'highest' | 'ending_soon' | 'recently_closed';

interface MobileFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (value: FilterType) => void;
}

export function MobileFilters({ activeFilter, onFilterChange }: MobileFiltersProps) {
  const filters = [
    { value: 'newest', label: 'Newest' },
    { value: 'highest', label: 'Highest Vol' },
    { value: 'ending_soon', label: 'Ending Soon' },
    { value: 'recently_closed', label: 'Closed' },
  ] as const;

  return (
    <div className='mb-4 flex gap-2 overflow-x-auto pb-2 md:hidden'>
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant='outline'
          size='sm'
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            'text-xs whitespace-nowrap',
            activeFilter === filter.value && 'bg-primary text-white'
          )}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
