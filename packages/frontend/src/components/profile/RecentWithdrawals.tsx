import { Separator } from '@/components/ui/separator';
import { TokenType } from '@/types';
import { WithdrawalData } from '@/types/interfaces';
import { toDecimal } from '@trump-fun/common';

export function RecentWithdrawals({ withdrawals }: { withdrawals?: WithdrawalData[] }) {
  if (!withdrawals || withdrawals.length === 0) return null;

  return (
    <>
      <Separator className='my-4' />
      <div className='space-y-3'>
        <div className='text-sm font-medium text-gray-500 dark:text-gray-400'>
          Recent Withdrawals
        </div>
        <div className='max-h-60 space-y-2 overflow-y-auto'>
          {withdrawals.slice(0, 5).map((withdrawal) => (
            <WithdrawalItem key={withdrawal.id} withdrawal={withdrawal} />
          ))}
        </div>
      </div>
    </>
  );
}

function WithdrawalItem({ withdrawal }: { withdrawal: WithdrawalData }) {
  const resolvedTokenType = withdrawal.bet?.tokenType === 0 ? TokenType.Usdc : TokenType.Freedom;
  const symbol = resolvedTokenType === TokenType.Usdc ? '💲' : '🦅';
  // Use centralized utility to format the amount with fallback to prevent errors
  const formattedAmount = withdrawal.bet?.amount
    ? toDecimal(withdrawal.bet.amount, resolvedTokenType).toFixed(0)
    : '0';

  // Safely convert timestamp to Date
  const date = new Date(
    typeof withdrawal.blockTimestamp === 'string'
      ? parseInt(withdrawal.blockTimestamp) * 1000
      : typeof withdrawal.blockTimestamp === 'number'
        ? withdrawal.blockTimestamp * 1000
        : Date.now()
  );

  return (
    <div className='rounded-md bg-gray-50 p-2 text-xs dark:bg-gray-800'>
      <div className='flex justify-between'>
        <span className='font-medium'>
          {symbol} {formattedAmount}
        </span>
        <span className='text-gray-500'>
          {date.toLocaleDateString()}{' '}
          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className='mt-1 truncate text-gray-500'>
        {withdrawal.bet?.pool?.question?.substring(0, 40)}...
      </div>
    </div>
  );
}
