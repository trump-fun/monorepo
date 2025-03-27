import { cn } from '@/lib/utils';
import * as React from 'react';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of percentages for each option */
  percentages: number[];
  /** Height of the progress bar */
  height?: string;
  /** Custom class for container */
  className?: string;
  /** Custom colors for each option (defaults to green for first, red for others) */
  colors?: string[];
  /** Background color for the progress bar */
  backgroundColor?: string;
  /** Whether to display as zero state regardless of percentages */
  isZeroState?: boolean;
}

export const ProgressBar = ({
  percentages,
  height = 'h-2',
  className,
  colors,
  backgroundColor = 'bg-gray-200 dark:bg-gray-700',
  isZeroState = false,
  ...props
}: ProgressBarProps) => {
  // Default colors if not provided (green for first option, red for second, fallback to gray for others)
  const defaultColors = [
    'bg-green-500',
    'bg-red-500',
    'bg-blue-500',
    'bg-yellow-500',
    'bg-purple-500',
  ];

  // If we're in a zero state or all percentages are 0, show empty bar
  const totalPercentage = percentages.reduce((sum, p) => sum + p, 0);
  const showEmpty = isZeroState || totalPercentage === 0;

  // Calculate exact percentage widths to ensure they add up to 100%
  const displayWidths = showEmpty
    ? percentages.map(() => 0)
    : percentages.map((percent) =>
        totalPercentage > 0 ? Math.round((percent / totalPercentage) * 100) : 0
      );

  return (
    <div
      className={cn('w-full overflow-hidden rounded-full', backgroundColor, className)}
      {...props}
    >
      <div className={cn('flex h-full', height)}>
        {displayWidths.map((width, index) => {
          // Use provided colors or fall back to defaults
          const colorClass = colors
            ? colors[index % colors.length]
            : defaultColors[index % defaultColors.length];

          // For zero state, use gray colors
          const finalColor = showEmpty ? 'bg-gray-300 dark:bg-gray-600' : colorClass;

          return (
            <div
              key={index}
              className={cn('h-full', finalColor)}
              style={{
                width: showEmpty
                  ? index === 0
                    ? '100%'
                    : '0%' // In zero state, just show one full gray bar
                  : `${width}%`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
