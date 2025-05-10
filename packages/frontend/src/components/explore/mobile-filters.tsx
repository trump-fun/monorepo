import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Define filter types to match the sidebar options
type FilterType = 'newest' | 'highest' | 'ending_soon' | 'recently_closed';

interface MobileFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (value: FilterType) => void;
}

// Define filters outside component to avoid recreating on each render
const FILTERS = [
  { value: 'newest' as const, label: 'Newest' },
  { value: 'highest' as const, label: 'Highest Vol' },
  { value: 'ending_soon' as const, label: 'Ending Soon' },
  { value: 'recently_closed' as const, label: 'Closed' },
];

// Optimized mobile filters component with memoized render
export function MobileFilters({ activeFilter, onFilterChange }: MobileFiltersProps) {
  return (
    <div
      className='mb-4 flex gap-2 overflow-x-auto pb-2 md:hidden'
      role='tablist'
      aria-label='Prediction filters'
    >
      {FILTERS.map((filter) => (
        <Button
          key={filter.value}
          variant='outline'
          size='sm'
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            'text-xs whitespace-nowrap',
            activeFilter === filter.value && 'bg-orange-500 text-white hover:bg-orange-600'
          )}
          role='tab'
          aria-selected={activeFilter === filter.value}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
