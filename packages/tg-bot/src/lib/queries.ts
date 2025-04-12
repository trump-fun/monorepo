import { gql } from '@apollo/client';
import type { DocumentNode } from '@apollo/client';

// Using proper gql import from Apollo to ensure DocumentNode typing
export const GET_POOLS: DocumentNode = gql`
  query GetPools(
    $filter: Pool_filter!
    $orderBy: Pool_orderBy!
    $orderDirection: OrderDirection!
    $first: Int
    $skip: Int
  ) {
    pools(
      where: $filter
      orderBy: $orderBy
      orderDirection: $orderDirection
      first: $first
      skip: $skip
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
      winningOption
      bets {
        id
        amount
        user
        option
      }
    }
  }
`;

export const GET_BET_PLACED: DocumentNode = gql`
  query GetBetPlaced(
    $first: Int = 10
    $skip: Int = 0
    $filter: BetPlaced_filter!
    $orderBy: BetPlaced_orderBy!
    $orderDirection: OrderDirection!
  ) {
    betPlaceds(
      first: $first
      skip: $skip
      where: $filter
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      betId
      optionIndex
      amount
      poolId
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

export const GET_BETS: DocumentNode = gql`
  query GetBets(
    $first: Int = 10
    $skip: Int = 0
    $filter: Bet_filter!
    $orderBy: Bet_orderBy!
    $orderDirection: OrderDirection!
  ) {
    bets(
      first: $first
      skip: $skip
      where: $filter
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      betId
      option
      amount
      poolId
      user
      blockNumber
      blockTimestamp
      transactionHash
      pool {
        id
        poolId
        question
        options
        status
        chainId
        chainName
        createdAt
        betsCloseAt
        winningOption
      }
    }
  }
`;

export const GET_POOL: DocumentNode = gql`
  query GetPool($poolId: String!) {
    pools(where: { poolId: $poolId }, first: 1) {
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
      gradedBlockNumber
      gradedBlockTimestamp
      gradedTransactionHash
      betsCloseAt
      usdcBetTotals
      pointsBetTotals
      usdcVolume
      pointsVolume
      winningOption
      bets {
        id
        option
        amount
        user
      }
    }
  }
`;

export const GET_USER_STATS: DocumentNode = gql`
  query GetUserStats($userAddress: String!) {
    bets(where: { user: $userAddress }) {
      id
      amount
      option
      pool {
        status
        winningOption
      }
    }
  }
`;
