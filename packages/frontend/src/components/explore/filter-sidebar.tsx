import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  TRUMP_FUN_TG_URL,
  TRUMP_FUN_TWITTER_URL,
  TRUMP_FUN_TWITTER_USERNAME,
} from '@trump-fun/common';
import Link from 'next/link';
import { FaTelegramPlane } from 'react-icons/fa';

// Define filter types to match the sidebar options
type FilterType = 'newest' | 'highest' | 'ending_soon' | 'recently_closed';

interface FilterSidebarProps {
  activeFilter: FilterType;
  onFilterChange: (value: FilterType) => void;
}

// Define the filter items outside the component for performance
const FILTER_ITEMS = [
  { value: 'newest' as const, label: 'Newest' },
  { value: 'highest' as const, label: 'Highest Vol.' },
  { value: 'ending_soon' as const, label: 'Ending Soon' },
  { value: 'recently_closed' as const, label: 'Recently Closed' },
];

// Optimized FilterSidebar component with memoized rendering
export function FilterSidebar({ activeFilter, onFilterChange }: FilterSidebarProps) {
  const renderFilterButton = (value: FilterType, label: string) => (
    <Button
      key={value}
      variant={activeFilter === value ? 'default' : 'ghost'}
      className={`w-full justify-start font-medium ${
        activeFilter === value ? 'bg-orange-500 hover:bg-orange-600' : ''
      }`}
      onClick={() => onFilterChange(value)}
    >
      {label}
    </Button>
  );

  return (
    <aside
      className='hidden w-60 flex-col border-r border-gray-200 p-4 md:flex dark:border-gray-800'
      aria-label='Filter options'
    >
      <div className='space-y-2'>
        <nav role='navigation' aria-label='Prediction filters'>
          {FILTER_ITEMS.map((item) => renderFilterButton(item.value, item.label))}
        </nav>

        <Separator className='my-2' />

        <div className='space-y-2'>
          <Link href={TRUMP_FUN_TWITTER_URL} target='_blank' rel='noopener noreferrer'>
            <Button variant='outline' className='mb-2 w-full justify-start gap-2'>
              <svg
                viewBox='0 0 24 24'
                aria-hidden='true'
                className='h-4 w-4 fill-current text-black dark:text-white'
              >
                <g>
                  <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'></path>
                </g>
              </svg>
              Follow @{TRUMP_FUN_TWITTER_USERNAME}
            </Button>
          </Link>
          <Link href={TRUMP_FUN_TG_URL} target='_blank' rel='noopener noreferrer'>
            <Button variant='outline' className='w-full justify-start gap-2'>
              <FaTelegramPlane className='h-4 w-4 text-black dark:text-white' />
              Telegram Bot
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  );
}
