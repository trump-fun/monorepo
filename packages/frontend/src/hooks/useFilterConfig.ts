import {
  Bet_OrderBy,
  OrderDirection,
  PayoutClaimed_OrderBy,
  PoolStatus,
} from '../types/__generated__/graphql';
import { useMemo } from 'react';

export function useFilterConfig(address?: string, activeFilter: string = 'active') {
  return useMemo(() => {
    const filterConfigs: Record<string, any> = {
      active: {
        orderBy: Bet_OrderBy.CreatedAt,
        orderDirection: OrderDirection.Desc,
        where: {
          user: address?.toLowerCase(),
          pool_: {
            status: PoolStatus.Pending,
          },
        },
      },
      won: {
        orderBy: PayoutClaimed_OrderBy.Amount,
        orderDirection: OrderDirection.Desc,
        where: {
          user: address?.toLowerCase(),
          bet_: {
            user: address?.toLowerCase(),
          },
        },
      },
      lost: {
        orderBy: Bet_OrderBy.CreatedAt,
        orderDirection: OrderDirection.Desc,
        where: {
          user: address?.toLowerCase(),
          pool_: {
            status: PoolStatus.Graded,
          },
          isWithdrawn: false,
        },
      },
      all: {
        orderBy: Bet_OrderBy.CreatedAt,
        orderDirection: OrderDirection.Desc,
        where: {
          user: address?.toLowerCase(),
        },
      },
    };

    return filterConfigs[activeFilter as keyof typeof filterConfigs] || filterConfigs.active;
  }, [address, activeFilter]);
}
