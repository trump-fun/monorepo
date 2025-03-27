import { gql } from '@apollo/client';

export const GET_POOLS = gql(`
  query GetPools(
    $filter: Pool_filter!
    $orderBy: Pool_orderBy!
    $orderDirection: OrderDirection!
    $first: Int
  ) {
    pools(
      where: $filter
      orderBy: $orderBy
      orderDirection: $orderDirection
      first: $first
    ) {
        id
        poolId
        question
        options
        status
        chainId
        chainName
        createdAt
        createdBlockNumber
        createdBlockTimestamp
        createdTransactionHash
        lastUpdatedBlockNumber
        lastUpdatedBlockTimestamp
        lastUpdatedTransactionHash
        gradedBlockNumber
        gradedBlockTimestamp
        gradedTransactionHash
        betsCloseAt
        usdcBetTotals
        pointsBetTotals
        usdcVolume
        pointsVolume
        originalTruthSocialPostId
    }
  }
`);
