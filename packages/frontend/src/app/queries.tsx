'use client';

import { gql } from '@/types';
import { gql as apolloGql } from '@apollo/client';

export const GET_POOLS = gql(`
  query GetPools(
    $filter: Pool_filter!
    $orderBy: Pool_orderBy!
    $orderDirection: OrderDirection!
    $first: Int
  ) {
    pools(where: $filter, orderBy: $orderBy, orderDirection: $orderDirection, first: $first) {
      id
      poolId
      question
      options
      status
      chainId
      bets {
        id
        betId
        user
        option
        amount
        tokenType
        updatedAt
      }
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

export const GET_BETS = gql(`
  query GetBets(
    $first: Int = 10
    $filter: Bet_filter!
    $orderBy: Bet_orderBy!
    $orderDirection: OrderDirection!
  ) {
    bets(first: $first, where: $filter, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      betId
      option
      amount
      poolId
      blockNumber
      blockTimestamp
      transactionHash
      user
      tokenType
      createdAt
      isWithdrawn
      chainName
      updatedAt
      pool {
        id
        poolId
        question
        options
        status
        chainId
        chainName
        createdAt
        pointsVolume
        usdcVolume
        usdcBetTotals
        pointsBetTotals
        originalTruthSocialPostId
        betsCloseAt
        status
      }
    }
  }
`);

export const GET_PAYOUT_CLAIMED = gql(`
  query GetPayoutClaimed(
    $first: Int = 100
    $skip: Int = 0
    $orderBy: PayoutClaimed_orderBy = blockTimestamp
    $orderDirection: OrderDirection = desc
    $where: PayoutClaimed_filter
  ) {
    payoutClaimeds(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
    ) {
      id
      betId
      poolId
      user
      amount
      tokenType
      blockNumber
      blockTimestamp
      transactionHash
      chainName
      chainId
      bet {
        id
        amount
        option
        user
        createdAt
        isWithdrawn
        tokenType
        pool {
          id
          question
          options
          status
          winningOption
          isDraw
          betsCloseAt
          usdcVolume
          pointsVolume
          usdcBetTotals
          pointsBetTotals
        }
      }
      pool {
        id
        question
        options
        status
        winningOption
        isDraw
        betsCloseAt
        usdcVolume
        pointsVolume
        usdcBetTotals
        pointsBetTotals
      }
    }
  }
`);

export const GET_BET_WITHDRAWALS = gql(`
  query GetBetWithdrawals(
    $first: Int = 100
    $skip: Int = 0
    $orderBy: BetWithdrawal_orderBy = blockTimestamp
    $orderDirection: OrderDirection = desc
    $where: BetWithdrawal_filter
  ) {
    betWithdrawals(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
    ) {
      id
      betId
      user
      blockNumber
      blockTimestamp
      transactionHash
      chainName
      chainId
    }
  }
`);

export const GET_BET_PLACEDS = gql(`
  query GetBetPlaced(
    $first: Int = 10
    $filter: BetPlaced_filter!
    $orderBy: BetPlaced_orderBy!
    $orderDirection: OrderDirection!
  ) {
    betPlaceds(first: $first, where: $filter, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      betId
      user
      optionIndex
      amount
      poolId
      blockNumber
      blockTimestamp
      transactionHash
      tokenType
    }
  }
`);

// TODO what is going on with GQL?
export const GET_BET_PLACEDS_SERVER = apolloGql(`
  query GetBetPlaced(
    $first: Int = 10
    $filter: BetPlaced_filter!
    $orderBy: BetPlaced_orderBy!
    $orderDirection: OrderDirection!
  ) {
    betPlaceds(first: $first, where: $filter, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      betId
      user
      optionIndex
      amount
      poolId
      blockNumber
      blockTimestamp
      transactionHash
      tokenType
    }
  }
`);

export const GET_POOL = gql(`
  query GetPool($poolId: ID!) {
    pool(id: $poolId) {
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
      originalTruthSocialPostId
      bets {
        id
        betId
        user
        option
        amount
        tokenType
      }
    }
  }
`);
