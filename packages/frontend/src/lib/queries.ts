'use client';

import { gql } from '@apollo/client';
import {
  GET_POOLS_STRING,
  GET_POOL_STRING,
  GET_BETS_STRING,
  GET_BET_PLACED_STRING,
  GET_PAYOUT_CLAIMED_STRING,
  GET_BET_WITHDRAWALS_STRING,
} from '@trump-fun/common/src/graphql/queries';

// Re-export the string versions for server components
export {
  GET_BETS_STRING,
  GET_PAYOUT_CLAIMED_STRING,
  GET_BET_WITHDRAWALS_STRING,
  GET_POOLS_STRING,
  GET_POOL_STRING,
  GET_BET_PLACED_STRING,
};

/**
 * Client-side Apollo-compatible versions of the queries
 */
export const GET_POOLS = gql(GET_POOLS_STRING);
export const GET_POOL = gql(GET_POOL_STRING);
export const GET_BETS = gql(GET_BETS_STRING);
export const GET_BET_PLACEDS = gql(GET_BET_PLACED_STRING);
export const GET_PAYOUT_CLAIMED = gql(GET_PAYOUT_CLAIMED_STRING);
export const GET_BET_WITHDRAWALS = gql(GET_BET_WITHDRAWALS_STRING);

/**
 * Server-side Apollo-compatible versions of the queries
 * (These are the same as client-side versions now since we're using Apollo's gql for both)
 */
export const GET_POOLS_SERVER_APOLLO = gql(GET_POOLS_STRING);
export const GET_POOL_SERVER_APOLLO = gql(GET_POOL_STRING);
export const GET_BET_PLACEDS_SERVER_APOLLO = gql(GET_BET_PLACED_STRING);
