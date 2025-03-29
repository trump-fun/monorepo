'use client';

import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNetwork } from '@/hooks/useNetwork';
import { cn } from '@/lib/utils';
import { CHAIN_CONFIG } from '@trump-fun/common/';

export function NetworkIndicator() {
  const { networkInfo, switchNetwork } = useNetwork();

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Badge
            variant='outline'
            className={cn(
              networkInfo.color,
              'mr-2 cursor-pointer px-2 py-1 font-medium',
              !networkInfo.isSupported && 'border-red-500'
            )}
          >
            {networkInfo.name}
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-48'>
          {!networkInfo.isSupported && (
            <div className='mb-1 border-b px-2 py-1.5 text-xs font-medium text-red-500'>
              {networkInfo.name} is not supported, please switch to one of the following:
            </div>
          )}

          {/* Dynamically render supported networks from CHAIN_CONFIG */}
          {Object.entries(CHAIN_CONFIG).map(([chainId, _]) => {
            const id = Number(chainId);
            // Get network display info from the hook's mapping
            const networkData =
              networkInfo.id === id
                ? networkInfo
                : {
                    id: id,
                    name: id === 84532 ? 'Base Sepolia' : 'Arbitrum Sepolia',
                    color:
                      id === 84532
                        ? 'bg-orange-500/10 text-orange-500'
                        : 'bg-purple-500/10 text-purple-500',
                  };

            return (
              <DropdownMenuItem
                key={chainId}
                className={cn('flex justify-between', networkInfo.id === id && networkData.color)}
                onClick={() => switchNetwork(id)}
              >
                {networkData.name}
                {networkInfo.id === id && (
                  <span className='ml-2 text-xs opacity-70'>• Current</span>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
