import { apolloClient } from '@/lib/apollo/client';
import { GET_POOL } from '@/server/queries';
import { Pool } from '@trump-fun/common';

export async function fetchPool(poolId: string): Promise<Pool | null> {
  const { data } = await apolloClient.query({
    query: GET_POOL,
    variables: {
      filter: { poolId },
    },
  });

  return data?.pools?.length ? (data.pools[0] as Pool) : null;
}
