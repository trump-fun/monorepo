'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNetwork } from '@/hooks/useNetwork';
import { cn } from '@/lib/utils';

export function NetworkIndicator() {
  const { networkInfo, switchNetwork, isHovering, setIsHovering, supportedNetworks } = useNetwork();

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <div
        className='relative'
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Badge
          variant='outline'
          className={cn(
            networkInfo.color,
            'mr-2 cursor-pointer bg-blue-600/40 px-2 py-1 font-medium text-blue-400 hover:bg-blue-600/40 hover:text-blue-400',
            !networkInfo.isSupported && 'border-red-500 text-red-500'
          )}
          onClick={() => setIsHovering(!isHovering)}
        >
          {networkInfo.name}
        </Badge>

        {isHovering && (
          <div className='absolute z-50 mt-1 w-48 rounded-md border border-gray-700 bg-gray-900 p-2 text-xs shadow-lg'>
            {!networkInfo.isSupported ? (
              <>
                <p className='mb-2'>Please switch to a supported network.</p>
                <div className='mt-2 flex flex-col gap-1'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full bg-blue-600/10 text-xs text-blue-500 hover:text-blue-400'
                    onClick={() => switchNetwork(supportedNetworks.baseSepolia.id)}
                  >
                    Switch to Base Sepolia
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full bg-blue-700/10 text-xs text-blue-600 hover:text-blue-500'
                    onClick={() => switchNetwork(supportedNetworks.base.id)}
                  >
                    Switch to Base
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full bg-blue-500/10 text-xs text-blue-500 hover:text-blue-400'
                    onClick={() => switchNetwork(supportedNetworks.mainnet.id)}
                  >
                    Switch to Ethereum
                  </Button>
                </div>
              </>
            ) : (
              <p className='mb-2'>You&apos;re on a supported network.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
