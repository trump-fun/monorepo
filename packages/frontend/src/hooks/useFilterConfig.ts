import { Bet_OrderBy, OrderDirection, PayoutClaimed_OrderBy, PoolStatus } from '@trump-fun/common';
import { useMemo } from 'react';
export function useFilterConfig(address?: string, activeFilter: string = 'active') {
  return useMemo(() => {
    const filterConfigs: Record<string, any> = {
      active: {
        orderBy: Bet_OrderBy.UpdatedAt,
        orderDirection: OrderDirection.desc,
        filter: {
          user: address,
          pool_: {
            status: PoolStatus.Pending,
          },
        },
      },
      won: {
        orderBy: PayoutClaimed_OrderBy.BlockTimestamp,
        orderDirection: OrderDirection.desc,
        where: {
          user: address?.toLowerCase(),
          bet_: {
            user: address,
          },
        },
      },
      lost: {
        orderBy: Bet_OrderBy.UpdatedAt,
        orderDirection: OrderDirection.desc,
        filter: {
          user: address,
          pool_: {
            status: PoolStatus.Graded,
          },
          isWithdrawn: false,
        },
      },
      all: {
        orderBy: Bet_OrderBy.UpdatedAt,
        orderDirection: OrderDirection.desc,
        filter: {
          user: address,
        },
      },
    };

    return filterConfigs[activeFilter as keyof typeof filterConfigs] || filterConfigs.active;
  }, [address, activeFilter]);
}
