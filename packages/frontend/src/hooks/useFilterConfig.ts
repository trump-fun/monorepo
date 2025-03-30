import {
  Bet_OrderBy,
  GetBetsQueryVariables,
  GetPayoutClaimedQueryVariables,
  OrderDirection,
  PayoutClaimed_OrderBy,
  PoolStatus,
} from '@/types/__generated__/graphql';
import { useMemo } from 'react';
export function useFilterConfig(address?: string, activeFilter: string = 'active') {
  return useMemo(() => {
    const filterConfigs: Record<string, GetPayoutClaimedQueryVariables | GetBetsQueryVariables> = {
      active: {
        orderBy: Bet_OrderBy.UpdatedAt,
        orderDirection: OrderDirection.Desc,
        filter: {
          user: address,
          pool_: {
            status: PoolStatus.Pending,
          },
        },
      },
      won: {
        orderBy: PayoutClaimed_OrderBy.BlockTimestamp,
        orderDirection: OrderDirection.Desc,
        where: {
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
            status: PoolStatus.Graded,
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
