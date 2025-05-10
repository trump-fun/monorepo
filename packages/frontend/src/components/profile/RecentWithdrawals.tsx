import { TokenType } from '@/types';
import { formatDistance } from 'date-fns';
import { toDecimal } from '@/utils/betsCalculations';
type WithdrawalData = {
  bet?: {
    amount: string;
    tokenType: TokenType;
  };
  createdAt?: string | number;
  txHash?: string;
};

export function RecentWithdrawals({ withdrawals }: { withdrawals: WithdrawalData[] }) {
  if (!withdrawals || withdrawals.length === 0) {
    return (
      <div className='mb-6'>
        <h3 className='mb-4 text-lg font-semibold'>Recent Withdrawals</h3>
        <p className='text-sm text-gray-500'>No withdrawals yet</p>
      </div>
    );
  }

  return (
    <div className='mb-6'>
      <h3 className='mb-4 text-lg font-semibold'>Recent Withdrawals</h3>
      <div className='space-y-2'>
        {withdrawals.map((withdrawal, idx) => (
          <WithdrawalItem key={idx} withdrawal={withdrawal} />
        ))}
      </div>
    </div>
  );
}

function WithdrawalItem({ withdrawal }: { withdrawal: WithdrawalData }) {
  const resolvedTokenType =
    withdrawal.bet?.tokenType === TokenType.Usdc ? TokenType.Usdc : TokenType.Freedom;
  const symbol = resolvedTokenType === TokenType.Usdc ? '💲' : '🦅';
  // Use centralized utility to format the amount with fallback to prevent errors
  const formattedAmount = withdrawal.bet?.amount
    ? toDecimal(withdrawal.bet.amount, resolvedTokenType).toFixed(0)
    : '0';

  // Safely convert timestamp to Date
  const date = new Date(
    typeof withdrawal.createdAt === 'string'
      ? parseInt(withdrawal.createdAt) * 1000
      : typeof withdrawal.createdAt === 'number'
        ? withdrawal.createdAt * 1000
        : Date.now()
  );

  return (
    <div className='rounded-md bg-gray-50 p-2 text-xs dark:bg-gray-800'>
      <div className='flex justify-between'>
        <span className='font-medium'>
          {symbol} {formattedAmount}
        </span>
        <span className='text-gray-500'>
          {formatDistance(date, new Date(), { addSuffix: true })}
        </span>
      </div>
      {withdrawal.txHash && (
        <a
          href={`https://explorer.solana.com/tx/${withdrawal.txHash}?cluster=devnet`}
          target='_blank'
          rel='noopener noreferrer'
          className='mt-1 block truncate text-gray-500 hover:text-blue-500'
        >
          {withdrawal.txHash.slice(0, 16)}...
        </a>
      )}
    </div>
  );
}
