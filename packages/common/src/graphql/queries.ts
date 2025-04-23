import { gql } from '@apollo/client';

// Complete pool fields including everything we might need in any context
const POOL_FIELDS = `
  id
  poolId
  question
  options
  status
  chainId
  chainName
  createdAt
  imageUrl
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
  isDraw
`;

// Complete bet fields including everything we might need
const BET_FIELDS = `
  id
  betId
  user
  option
  amount
  poolId
  tokenType
  blockNumber
  blockTimestamp
  transactionHash
  createdAt
  isWithdrawn
  chainName
  chainId
  updatedAt
`;

// Fields specific to BetWithdrawal type that match the schema
const BET_WITHDRAWAL_FIELDS = `
  id
  betId
  user
  amount
  tokenType
  blockNumber
  blockTimestamp
  transactionHash
  chainName
  chainId
`;

// Pool fields with nested bets
const POOL_WITH_BETS = `
  ${POOL_FIELDS}
  bets {
    ${BET_FIELDS}
  }
`;

/**
 * ==============================
 * CORE QUERY STRINGS
 * ==============================
 * These can be used in both client and server environments
 */

/**
 * Primary query for fetching pools with their bets
 */
export const GET_POOLS_STRING = `
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
      ${POOL_WITH_BETS}
    }
  }
`;

/**
 * Apollo Client version of the pools query
 */
export const GET_POOLS = gql(GET_POOLS_STRING);

/**
 * Raw query string for non-Apollo environments
 */
/**
 * Query to fetch a single pool by ID
 */
export const GET_POOL_STRING = `
  query GetPool($poolId: ID!) {
    pool(id: $poolId) {
      ${POOL_WITH_BETS}
    }
  }
`;

/**
 * Apollo Client version of the single pool query
 */
export const GET_POOL = gql(GET_POOL_STRING);

/**
 * Raw query string for non-Apollo environments
 */
/**
 * Query to fetch bets with filtering, ordering and pagination
 */
export const GET_BETS_STRING = `
  query GetBets(
    $first: Int = 10
    $filter: Bet_filter!
    $orderBy: Bet_orderBy!
    $orderDirection: OrderDirection!
    $skip: Int = 0
  ) {
    bets(
      first: $first
      where: $filter
      orderBy: $orderBy
      orderDirection: $orderDirection
      skip: $skip
    ) {
      ${BET_FIELDS}
      pool {
        ${POOL_FIELDS}
      }
    }
  }
`;

/**
 * Apollo Client version of the bets query
 */
export const GET_BETS = gql(GET_BETS_STRING);

/**
 * Raw query string for non-Apollo environments
 */
/**
 * Query to fetch bet placed events
 */
export const GET_BET_PLACED_STRING = `
  query GetBetPlaced(
    $first: Int = 10
    $filter: BetPlaced_filter!
    $orderBy: BetPlaced_orderBy!
    $orderDirection: OrderDirection!
    $skip: Int = 0
  ) {
    betPlaceds(
      first: $first
      where: $filter
      orderBy: $orderBy
      orderDirection: $orderDirection
      skip: $skip
    ) {
      id
      betId
      poolId
      user
      optionIndex      
      amount
      tokenType
      blockNumber
      blockTimestamp
      transactionHash
      chainName
      chainId
    }
  }
`;

/**
 * Apollo Client version of the bet placed query
 */
export const GET_BET_PLACED = gql(GET_BET_PLACED_STRING);

/**
 * Raw query string for non-Apollo environments
 */
/**
 * Query to fetch payout claimed events
 */
export const GET_PAYOUT_CLAIMED_STRING = `
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
        ${BET_FIELDS}
        pool {
          ${POOL_FIELDS}
        }
      }
      pool {
        ${POOL_FIELDS}
      }
    }
  }
`;

/**
 * Apollo Client version of the payout claimed query
 */
export const GET_PAYOUT_CLAIMED = gql(GET_PAYOUT_CLAIMED_STRING);

/**
 * Raw query string for non-Apollo environments
 */
/**
 * Query to fetch bet withdrawals
 */
export const GET_BET_WITHDRAWALS_STRING = `
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
      ${BET_WITHDRAWAL_FIELDS}
    }
  }
`;

/**
 * Apollo Client version of the bet withdrawals query
 */
export const GET_BET_WITHDRAWALS = gql(GET_BET_WITHDRAWALS_STRING);
