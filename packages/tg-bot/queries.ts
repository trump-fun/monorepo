import { gql } from '@apollo/client';
import {
  GET_POOLS_STRING,
  GET_POOL_STRING,
  GET_BETS_STRING,
  GET_BET_PLACED_STRING,
  GET_PAYOUT_CLAIMED_STRING,
} from '@trump-fun/common/src/graphql/queries';

/**
 * Telegram bot queries using centralized query definitions
 * from the common package
 */

// Use the string versions from common package with Apollo's gql
export const GET_POOLS = gql(GET_POOLS_STRING);
export const GET_POOL = gql(GET_POOL_STRING);
export const GET_BETS = gql(GET_BETS_STRING);
export const GET_BET_PLACED = gql(GET_BET_PLACED_STRING);
export const GET_PAYOUT_CLAIMED = gql(GET_PAYOUT_CLAIMED_STRING);
