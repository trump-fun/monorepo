import { apolloClient } from '@/lib/apollo/client';
import { GET_POOL } from '@/server/queries';
import { Pool, Pool_OrderBy } from '@trump-fun/common';

export async function fetchPool(poolId: string): Promise<Pool | null> {
  const { data } = await apolloClient.query({
    query: GET_POOL,
    variables: {
      filter: { poolId },
      orderBy: Pool_OrderBy.CreatedAt,
      orderDirection: 'desc',
    },
  });

  return data?.pools?.length ? (data.pools[0] as Pool) : null;
}
