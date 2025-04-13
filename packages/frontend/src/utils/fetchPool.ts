import { apolloClient } from '@/lib/apollo';
import { Pool } from '@/types';
import { QueryOptions } from '@apollo/client/core';
import { GET_POOL } from '@trump-fun/common';

interface GetPoolQueryVariables {
  poolId: string;
}

export async function fetchPool(
  poolId: string,
  options?: QueryOptions<GetPoolQueryVariables>
): Promise<Pool | null> {
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
