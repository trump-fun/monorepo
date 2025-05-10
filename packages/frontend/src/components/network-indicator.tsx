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
import { Cluster } from '@solana/web3.js';

export function NetworkIndicator() {
  const { networkInfo } = useNetwork();

  // Solana clusters
  const clusters: { name: string; value: Cluster; color: string; enabled: boolean }[] = [
    {
      name: 'Solana Devnet',
      value: 'devnet',
      color: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20',
      enabled: true,
    },
    {
      name: 'Solana Testnet',
      value: 'testnet',
      color: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
      enabled: false,
    },
    {
      name: 'Solana Mainnet',
      value: 'mainnet-beta',
      color: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
      enabled: false,
    },
  ];

  // Get current cluster info
  const currentCluster = clusters.find((c) => c.value === networkInfo.cluster) || clusters[0];

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Badge
            variant='outline'
            className={cn(networkInfo.color, 'mr-2 cursor-pointer px-2 py-1 font-medium')}
          >
            {currentCluster.name}
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-48'>
          <div className='mb-1 border-b px-2 py-1.5 text-xs font-medium'>Solana Clusters</div>

          {clusters.map((cluster) => (
            <DropdownMenuItem
              key={cluster.value}
              className={cn(
                'flex justify-between',
                networkInfo.cluster === cluster.value && cluster.color,
                !cluster.enabled && 'cursor-not-allowed opacity-50'
              )}
              disabled={!cluster.enabled}
            >
              {cluster.name}
              {networkInfo.cluster === cluster.value && (
                <span className='ml-2 text-xs opacity-70'>• Current</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
