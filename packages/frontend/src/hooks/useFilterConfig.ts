import { Bet_OrderBy, OrderDirection, PayoutClaimed_OrderBy } from '@trump-fun/common';
import { useMemo } from 'react';

export function useFilterConfig(address?: string, activeFilter: string = 'active') {
  return useMemo(() => {
    const filterConfigs = {
      active: {
        orderBy: Bet_OrderBy.UpdatedAt,
        orderDirection: OrderDirection.Desc,
        filter: {
          user: address,
          pool_: {
            status: 'PENDING',
          },
        },
      },
      won: {
        orderBy: PayoutClaimed_OrderBy.BlockTimestamp,
        orderDirection: OrderDirection.Desc,
        filter: {
          user: address?.toLowerCase(),
          bet_: {
            user: address,
          },
        },
      },
      lost: {
        orderBy: Bet_OrderBy.UpdatedAt,
        orderDirection: OrderDirection.Desc,
        filter: {
          user: address,
          pool_: {
            status: 'GRADED',
          },
          isWithdrawn: false,
        },
      },
      all: {
        orderBy: Bet_OrderBy.UpdatedAt,
        orderDirection: OrderDirection.Desc,
        filter: {
          user: address,
        },
      },
    };

    return filterConfigs[activeFilter as keyof typeof filterConfigs] || filterConfigs.active;
  }, [address, activeFilter]);
}
