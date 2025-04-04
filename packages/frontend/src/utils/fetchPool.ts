import { GET_POOL } from '@/app/queries';
import { apolloClient } from '@/lib/apollo';
import { GetPoolQuery } from '@/types/__generated__/graphql';

export async function fetchPool(poolId: string): Promise<GetPoolQuery['pool'] | null> {
  const { data } = await apolloClient.query({
    query: GET_POOL,
    variables: {
      poolId,
    },
  });

  return data.pool;
}
