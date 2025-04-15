import { ProgressBar } from '@/components/ui/progress-bar';
import { useTokenContext } from '@/hooks/useTokenContext';
import { getBetTotals } from '@/utils/betsInfo';
import { Pool } from '@trump-fun/common';

interface BettingProgressProps {
  percentages: number[];
  pool: Pool | Pool[][number];
  totalVolume: string;
  compact?: boolean;
}

export const BettingProgress = ({
  percentages,
  pool,
  totalVolume,
  compact = false,
}: BettingProgressProps) => {
  const { tokenType } = useTokenContext();
  const isZeroState = totalVolume === '$0' || totalVolume === '0 pts' || percentages[0] === 0;

  if (!pool) {
    return null;
  }

  return (
    <div className={compact ? '' : 'mb-6'}>
      <ProgressBar
        percentages={percentages}
        height={compact ? 'h-1' : 'h-4'}
        className={compact ? '' : 'mb-2'}
        isZeroState={isZeroState}
      />
      {!compact && (
        <div className='mb-2 flex justify-between text-sm font-medium'>
          {pool.options.map((option: string, index: number) => (
            <span
              key={index}
              className={
                index === 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }
            >
              {option} {percentages[index]}% ({getBetTotals(pool, tokenType, index)})
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
