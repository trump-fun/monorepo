import { apolloClient } from '@/lib/apollo';
import { GetPoolQuery, GetPoolQueryVariables } from '@/types/__generated__/graphql';
import { QueryOptions } from '@apollo/client/core';
import { GET_POOL } from '@trump-fun/common';

export async function fetchPool(
  poolId: string,
  options?: QueryOptions<GetPoolQueryVariables>
): Promise<GetPoolQuery['pool'] | null> {
  try {
    const { data } = await apolloClient.query({
      ...options,
      query: GET_POOL,
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
