import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useState } from 'react';

interface TokenDisplayProps {
  className?: string;
  showBoth?: boolean;
}

export function TokenDisplay({ className = '', showBoth = false }: TokenDisplayProps) {
  const { formattedBalance, tokenLogo, symbol, usdcBalance, freedomBalance } = useTokenBalance();

  const [showBalances, setShowBalances] = useState(showBoth);

  if (showBalances) {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        <div className='flex items-center gap-1'>
          <span>🦅</span>
          <span>{freedomBalance} FREEDOM</span>
        </div>
        <div className='flex items-center gap-1'>
          <span>💵</span>
          <span>{usdcBalance} USDC</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1 ${className}`}
      onClick={() => setShowBalances(!showBalances)}
    >
      {tokenLogo}
      <span>{formattedBalance}</span>
      <span className='text-muted-foreground text-xs'>{symbol}</span>
    </div>
  );
}
