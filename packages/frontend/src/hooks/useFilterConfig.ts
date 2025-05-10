import {
  Bet_Filter,
  Bet_OrderBy,
  OrderDirection,
  PayoutClaimed_Filter,
  PayoutClaimed_OrderBy,
  PoolStatus,
} from '../types/__generated__/graphql';
import { useMemo } from 'react';

interface FilterConfig {
  orderBy: Bet_OrderBy | PayoutClaimed_OrderBy;
  orderDirection: OrderDirection;
  where: Bet_Filter | PayoutClaimed_Filter;
}

export function useFilterConfig(address?: string, activeFilter: string = 'active') {
  return useMemo(() => {
    const lowerCaseAddress = address?.toLowerCase();

    // Define type-safe configurations for each filter
    const filterConfigs: Record<string, FilterConfig> = {
      active: {
        orderBy: Bet_OrderBy.CreatedAt,
        orderDirection: OrderDirection.Desc,
        where: {
          userAddress: lowerCaseAddress,
          pool_: {
            status: PoolStatus.Pending,
          },
        } as Bet_Filter,
      },
      won: {
        orderBy: PayoutClaimed_OrderBy.Amount,
        orderDirection: OrderDirection.Desc,
        where: {
          userAddress: lowerCaseAddress,
        } as PayoutClaimed_Filter,
      },
      lost: {
        orderBy: Bet_OrderBy.CreatedAt,
        orderDirection: OrderDirection.Desc,
        where: {
          userAddress: lowerCaseAddress,
          pool_: {
            status: PoolStatus.Graded,
          },
          isWithdrawn: false,
        } as Bet_Filter,
      },
      all: {
        orderBy: Bet_OrderBy.CreatedAt,
        orderDirection: OrderDirection.Desc,
        where: {
          userAddress: lowerCaseAddress,
        } as Bet_Filter,
      },
    };

    return filterConfigs[activeFilter] || filterConfigs.active;
  }, [address, activeFilter]);
}
