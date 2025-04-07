import { GET_POOL } from '@/app/queries';
import { apolloClient } from '@/lib/apollo';
import { GetPoolQuery, GetPoolQueryVariables } from '@/types/__generated__/graphql';
import { QueryOptions } from '@apollo/client/core';

export async function fetchPool(
  poolId: string,
  options?: QueryOptions<GetPoolQueryVariables>
): Promise<GetPoolQuery['pool'] | null> {
  const { data } = await apolloClient.query({
    ...options,
    query: GET_POOL,
    variables: {
      poolId,
    },
  });

  return data.pool;
}
