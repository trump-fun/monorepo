import { apolloClient } from '@/lib/apollo/client';
import { GET_POOL_SERVER } from '@/server/queries';
import { GetPoolQuery } from '@/types';

export async function fetchPool(poolId: string): Promise<GetPoolQuery['pool'] | null> {
  const { data } = await apolloClient.query({
    query: GET_POOL_SERVER,
    variables: {
      poolId,
    },
  });

  return data.pool;
}
