import { Separator } from '@/components/ui/separator';
import { POINTS_DECIMALS, TokenType, USDC_DECIMALS } from '@trump-fun/common';

export function RecentWithdrawals({ withdrawals }: { withdrawals?: any[] }) {
  if (!withdrawals || withdrawals.length === 0) return null;

  return (
    <>
      <Separator className='my-4' />
      <div className='space-y-3'>
        <div className='text-sm font-medium text-gray-500 dark:text-gray-400'>
          Recent Withdrawals
        </div>
        <div className='max-h-60 space-y-2 overflow-y-auto'>
          {withdrawals.slice(0, 5).map(withdrawal => (
            <WithdrawalItem key={withdrawal.id} withdrawal={withdrawal} />
          ))}
        </div>
      </div>
    </>
  );
}

function WithdrawalItem({ withdrawal }: { withdrawal: any }) {
  const resolvedTokenType = withdrawal.bet?.tokenType === 0 ? TokenType.Usdc : TokenType.Points;
  const symbol = resolvedTokenType === TokenType.Usdc ? '💲' : '🦅';
  const decimals = resolvedTokenType === TokenType.Usdc ? USDC_DECIMALS : POINTS_DECIMALS;
  const formattedAmount = (parseFloat(withdrawal.bet?.amount) / Math.pow(10, decimals)).toFixed(0);
  const date = new Date(withdrawal.blockTimestamp * 1000);

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
