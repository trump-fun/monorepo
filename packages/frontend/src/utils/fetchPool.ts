import { graphqlRequestSdk } from '@/lib/graphql-client';

export async function fetchPool(poolId: string | number) {
  try {
    const { pool } = await graphqlRequestSdk.GetPool({
      poolId: poolId.toString(),
    });

    return pool || null;
  } catch (error) {
    console.error('Error fetching pool:', error);
    return null;
  }
}
