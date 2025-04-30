import { apolloClient } from '@/lib/apollo';
import { gql } from '@apollo/client';
import { QueryOptions } from '@apollo/client/core';
import { GET_POOL_STRING } from '@trump-fun/common';

interface GetPoolQueryVariables {
  poolId: string;
}

export async function fetchPool(
  poolId: string | number,
  options?: QueryOptions<GetPoolQueryVariables>
) {
  try {
    const { data } = await apolloClient.query({
      ...options,

      query: gql(GET_POOL_STRING),
      variables: { poolId: poolId.toString() },
      fetchPolicy: 'network-only',
    });

    return data?.pool || null;
  } catch (error) {
    console.error('Error fetching pool:', error);
    return null;
  }
}
