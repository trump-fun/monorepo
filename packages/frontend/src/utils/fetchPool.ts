import { apolloClient } from '@/lib/apollo';
import { GET_POOL_SERVER } from '@/lib/queries';
import { GetPoolQuery, GetPoolQueryVariables } from '@/types/__generated__/graphql';
import { QueryOptions } from '@apollo/client/core';

export async function fetchPool(
  poolId: string,
  options?: QueryOptions<GetPoolQueryVariables>
): Promise<GetPoolQuery['pool'] | null> {
  try {
    const { data } = await apolloClient.query({
      ...options,
      query: GET_POOL_SERVER,
      variables: {
        poolId,
      },
    });

    return data.pool;
  } catch (error) {
    console.error('Error in fetchPool:', error);
    throw error;
  }
}
