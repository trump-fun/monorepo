'use client';

import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tooltip } from '@/components/ui/tooltip';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useTokenContext } from '@/hooks/useTokenContext';
import { cn } from '@/lib/utils';
import { TokenType } from '@/types';

export function TokenSwitch() {
  const { tokenType, setTokenType, tokenLogo } = useTokenContext();

  // For FREEDOM, always use the zero address
  const { formattedBalance, symbol } = useTokenBalance();

  const handleToggle = (checked: boolean) => {
    setTokenType(checked ? TokenType.Freedom : TokenType.Usdc);
  };

  return (
    <div className='flex items-center gap-2'>
      <Tooltip.Provider>
        <Tooltip>
          <Tooltip.Trigger asChild>
            <Badge
              variant='outline'
              className={cn(
                'flex items-center gap-1 px-2 py-1',
                tokenType === TokenType.Usdc
                  ? 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20'
                  : 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20'
              )}
            >
              <span>{tokenLogo}</span>
              <span className='ml-1 hidden sm:inline'>
                {tokenType === TokenType.Freedom ? 'FREEDOM' : 'USDC'}
              </span>
            </Badge>
          </Tooltip.Trigger>
          <Tooltip.Content>
            <p>{tokenType === TokenType.Freedom ? 'Trump Freedom' : 'USD'}</p>
            <p className='mt-1 text-xs text-gray-400'>
              Balance: {formattedBalance} {symbol}
            </p>
          </Tooltip.Content>
        </Tooltip>
      </Tooltip.Provider>

      <Switch
        checked={tokenType === TokenType.Freedom}
        onCheckedChange={handleToggle}
        className={cn('data-[state=checked]:bg-orange-500')}
      />
    </div>
  );
}
