/* eslint-disable */
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  BigDecimal: { input: any; output: any; }
  BigInt: { input: any; output: any; }
  Bytes: { input: any; output: any; }
  /**
   * 8 bytes signed integer
   *
   */
  Int8: { input: any; output: any; }
  /**
   * A string representation of microseconds UNIX timestamp (16 digits)
   *
   */
  Timestamp: { input: any; output: any; }
};

export enum Aggregation_interval {
  day = 'day',
  hour = 'hour'
}

export type Bet = {
  __typename?: 'Bet';
  amount: Scalars['BigInt']['output'];
  betIntId: Scalars['BigInt']['output'];
  createdAt: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  isPayedOut: Scalars['Boolean']['output'];
  optionIndex: Scalars['BigInt']['output'];
  outcome: BetOutcome;
  pool: Pool;
  poolIntId: Scalars['BigInt']['output'];
  tokenType: TokenType;
  txHash: Scalars['String']['output'];
  userAddress: Scalars['String']['output'];
};

export enum BetOutcome {
  Draw = 'Draw',
  Lost = 'Lost',
  None = 'None',
  Voided = 'Voided',
  Won = 'Won'
}

export type BetPlaced = {
  __typename?: 'BetPlaced';
  amount: Scalars['BigInt']['output'];
  bet: Bet;
  betId: Scalars['BigInt']['output'];
  createdAt: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  optionIndex: Scalars['BigInt']['output'];
  pool: Pool;
  poolId: Scalars['BigInt']['output'];
  tokenType: TokenType;
  txHash: Scalars['String']['output'];
  user: Scalars['String']['output'];
};

export type BetPlaced_filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  amount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  and?: InputMaybe<Array<InputMaybe<BetPlaced_filter>>>;
  bet?: InputMaybe<Scalars['String']['input']>;
  betId?: InputMaybe<Scalars['BigInt']['input']>;
  betId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  betId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  betId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  betId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  betId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  betId_not?: InputMaybe<Scalars['BigInt']['input']>;
  betId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  bet_?: InputMaybe<Bet_filter>;
  bet_contains?: InputMaybe<Scalars['String']['input']>;
  bet_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  bet_ends_with?: InputMaybe<Scalars['String']['input']>;
  bet_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  bet_gt?: InputMaybe<Scalars['String']['input']>;
  bet_gte?: InputMaybe<Scalars['String']['input']>;
  bet_in?: InputMaybe<Array<Scalars['String']['input']>>;
  bet_lt?: InputMaybe<Scalars['String']['input']>;
  bet_lte?: InputMaybe<Scalars['String']['input']>;
  bet_not?: InputMaybe<Scalars['String']['input']>;
  bet_not_contains?: InputMaybe<Scalars['String']['input']>;
  bet_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  bet_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  bet_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  bet_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  bet_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  bet_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  bet_starts_with?: InputMaybe<Scalars['String']['input']>;
  bet_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  createdAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  optionIndex?: InputMaybe<Scalars['BigInt']['input']>;
  optionIndex_gt?: InputMaybe<Scalars['BigInt']['input']>;
  optionIndex_gte?: InputMaybe<Scalars['BigInt']['input']>;
  optionIndex_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  optionIndex_lt?: InputMaybe<Scalars['BigInt']['input']>;
  optionIndex_lte?: InputMaybe<Scalars['BigInt']['input']>;
  optionIndex_not?: InputMaybe<Scalars['BigInt']['input']>;
  optionIndex_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  or?: InputMaybe<Array<InputMaybe<BetPlaced_filter>>>;
  pool?: InputMaybe<Scalars['String']['input']>;
  poolId?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  poolId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_not?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  pool_?: InputMaybe<Pool_filter>;
  pool_contains?: InputMaybe<Scalars['String']['input']>;
  pool_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_gt?: InputMaybe<Scalars['String']['input']>;
  pool_gte?: InputMaybe<Scalars['String']['input']>;
  pool_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_lt?: InputMaybe<Scalars['String']['input']>;
  pool_lte?: InputMaybe<Scalars['String']['input']>;
  pool_not?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  tokenType?: InputMaybe<TokenType>;
  tokenType_in?: InputMaybe<Array<TokenType>>;
  tokenType_not?: InputMaybe<TokenType>;
  tokenType_not_in?: InputMaybe<Array<TokenType>>;
  txHash?: InputMaybe<Scalars['String']['input']>;
  txHash_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_gt?: InputMaybe<Scalars['String']['input']>;
  txHash_gte?: InputMaybe<Scalars['String']['input']>;
  txHash_in?: InputMaybe<Array<Scalars['String']['input']>>;
  txHash_lt?: InputMaybe<Scalars['String']['input']>;
  txHash_lte?: InputMaybe<Scalars['String']['input']>;
  txHash_not?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  txHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user?: InputMaybe<Scalars['String']['input']>;
  user_contains?: InputMaybe<Scalars['String']['input']>;
  user_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  user_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_gt?: InputMaybe<Scalars['String']['input']>;
  user_gte?: InputMaybe<Scalars['String']['input']>;
  user_in?: InputMaybe<Array<Scalars['String']['input']>>;
  user_lt?: InputMaybe<Scalars['String']['input']>;
  user_lte?: InputMaybe<Scalars['String']['input']>;
  user_not?: InputMaybe<Scalars['String']['input']>;
  user_not_contains?: InputMaybe<Scalars['String']['input']>;
  user_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  user_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  user_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  user_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_starts_with?: InputMaybe<Scalars['String']['input']>;
  user_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum BetPlaced_orderBy {
  amount = 'amount',
  bet = 'bet',
  betId = 'betId',
  bet__amount = 'bet__amount',
  bet__betIntId = 'bet__betIntId',
  bet__createdAt = 'bet__createdAt',
  bet__id = 'bet__id',
  bet__isPayedOut = 'bet__isPayedOut',
  bet__optionIndex = 'bet__optionIndex',
  bet__outcome = 'bet__outcome',
  bet__poolIntId = 'bet__poolIntId',
  bet__tokenType = 'bet__tokenType',
  bet__txHash = 'bet__txHash',
  bet__userAddress = 'bet__userAddress',
  createdAt = 'createdAt',
  id = 'id',
  optionIndex = 'optionIndex',
  pool = 'pool',
  poolId = 'poolId',
  pool__betsCloseAt = 'pool__betsCloseAt',
  pool__category = 'pool__category',
  pool__closureCriteria = 'pool__closureCriteria',
  pool__closureInstructions = 'pool__closureInstructions',
  pool__createdAt = 'pool__createdAt',
  pool__creationTxHash = 'pool__creationTxHash',
  pool__creatorId = 'pool__creatorId',
  pool__creatorName = 'pool__creatorName',
  pool__decisionTime = 'pool__decisionTime',
  pool__id = 'pool__id',
  pool__imageUrl = 'pool__imageUrl',
  pool__isDraw = 'pool__isDraw',
  pool__originalTruthSocialPostId = 'pool__originalTruthSocialPostId',
  pool__pointsBetTotals = 'pool__pointsBetTotals',
  pool__poolIntId = 'pool__poolIntId',
  pool__question = 'pool__question',
  pool__status = 'pool__status',
  pool__twitterPostId = 'pool__twitterPostId',
  pool__usdcBetTotals = 'pool__usdcBetTotals',
  pool__winningOption = 'pool__winningOption',
  tokenType = 'tokenType',
  txHash = 'txHash',
  user = 'user'
}

export type Bet_filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  amount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  and?: InputMaybe<Array<InputMaybe<Bet_filter>>>;
  betIntId?: InputMaybe<Scalars['BigInt']['input']>;
  betIntId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  betIntId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  betIntId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  betIntId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  betIntId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  betIntId_not?: InputMaybe<Scalars['BigInt']['input']>;
  betIntId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  createdAt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  createdAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  isPayedOut?: InputMaybe<Scalars['Boolean']['input']>;
  isPayedOut_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  isPayedOut_not?: InputMaybe<Scalars['Boolean']['input']>;
  isPayedOut_not_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  optionIndex?: InputMaybe<Scalars['BigInt']['input']>;
  optionIndex_gt?: InputMaybe<Scalars['BigInt']['input']>;
  optionIndex_gte?: InputMaybe<Scalars['BigInt']['input']>;
  optionIndex_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  optionIndex_lt?: InputMaybe<Scalars['BigInt']['input']>;
  optionIndex_lte?: InputMaybe<Scalars['BigInt']['input']>;
  optionIndex_not?: InputMaybe<Scalars['BigInt']['input']>;
  optionIndex_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  or?: InputMaybe<Array<InputMaybe<Bet_filter>>>;
  outcome?: InputMaybe<BetOutcome>;
  outcome_in?: InputMaybe<Array<BetOutcome>>;
  outcome_not?: InputMaybe<BetOutcome>;
  outcome_not_in?: InputMaybe<Array<BetOutcome>>;
  pool?: InputMaybe<Scalars['String']['input']>;
  poolIntId?: InputMaybe<Scalars['BigInt']['input']>;
  poolIntId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  poolIntId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  poolIntId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  poolIntId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  poolIntId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  poolIntId_not?: InputMaybe<Scalars['BigInt']['input']>;
  poolIntId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  pool_?: InputMaybe<Pool_filter>;
  pool_contains?: InputMaybe<Scalars['String']['input']>;
  pool_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_gt?: InputMaybe<Scalars['String']['input']>;
  pool_gte?: InputMaybe<Scalars['String']['input']>;
  pool_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_lt?: InputMaybe<Scalars['String']['input']>;
  pool_lte?: InputMaybe<Scalars['String']['input']>;
  pool_not?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  tokenType?: InputMaybe<TokenType>;
  tokenType_in?: InputMaybe<Array<TokenType>>;
  tokenType_not?: InputMaybe<TokenType>;
  tokenType_not_in?: InputMaybe<Array<TokenType>>;
  txHash?: InputMaybe<Scalars['String']['input']>;
  txHash_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_gt?: InputMaybe<Scalars['String']['input']>;
  txHash_gte?: InputMaybe<Scalars['String']['input']>;
  txHash_in?: InputMaybe<Array<Scalars['String']['input']>>;
  txHash_lt?: InputMaybe<Scalars['String']['input']>;
  txHash_lte?: InputMaybe<Scalars['String']['input']>;
  txHash_not?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  txHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  userAddress?: InputMaybe<Scalars['String']['input']>;
  userAddress_contains?: InputMaybe<Scalars['String']['input']>;
  userAddress_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  userAddress_ends_with?: InputMaybe<Scalars['String']['input']>;
  userAddress_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  userAddress_gt?: InputMaybe<Scalars['String']['input']>;
  userAddress_gte?: InputMaybe<Scalars['String']['input']>;
  userAddress_in?: InputMaybe<Array<Scalars['String']['input']>>;
  userAddress_lt?: InputMaybe<Scalars['String']['input']>;
  userAddress_lte?: InputMaybe<Scalars['String']['input']>;
  userAddress_not?: InputMaybe<Scalars['String']['input']>;
  userAddress_not_contains?: InputMaybe<Scalars['String']['input']>;
  userAddress_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  userAddress_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  userAddress_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  userAddress_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  userAddress_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  userAddress_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  userAddress_starts_with?: InputMaybe<Scalars['String']['input']>;
  userAddress_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum Bet_orderBy {
  amount = 'amount',
  betIntId = 'betIntId',
  createdAt = 'createdAt',
  id = 'id',
  isPayedOut = 'isPayedOut',
  optionIndex = 'optionIndex',
  outcome = 'outcome',
  pool = 'pool',
  poolIntId = 'poolIntId',
  pool__betsCloseAt = 'pool__betsCloseAt',
  pool__category = 'pool__category',
  pool__closureCriteria = 'pool__closureCriteria',
  pool__closureInstructions = 'pool__closureInstructions',
  pool__createdAt = 'pool__createdAt',
  pool__creationTxHash = 'pool__creationTxHash',
  pool__creatorId = 'pool__creatorId',
  pool__creatorName = 'pool__creatorName',
  pool__decisionTime = 'pool__decisionTime',
  pool__id = 'pool__id',
  pool__imageUrl = 'pool__imageUrl',
  pool__isDraw = 'pool__isDraw',
  pool__originalTruthSocialPostId = 'pool__originalTruthSocialPostId',
  pool__pointsBetTotals = 'pool__pointsBetTotals',
  pool__poolIntId = 'pool__poolIntId',
  pool__question = 'pool__question',
  pool__status = 'pool__status',
  pool__twitterPostId = 'pool__twitterPostId',
  pool__usdcBetTotals = 'pool__usdcBetTotals',
  pool__winningOption = 'pool__winningOption',
  tokenType = 'tokenType',
  txHash = 'txHash',
  userAddress = 'userAddress'
}

export type BlockChangedFilter = {
  number_gte: Scalars['Int']['input'];
};

export type Block_height = {
  hash?: InputMaybe<Scalars['Bytes']['input']>;
  number?: InputMaybe<Scalars['Int']['input']>;
  number_gte?: InputMaybe<Scalars['Int']['input']>;
};

export enum MediaType {
  ExternalLink = 'ExternalLink',
  Facebook = 'Facebook',
  Image = 'Image',
  Instagram = 'Instagram',
  TikTok = 'TikTok',
  Video = 'Video',
  X = 'X'
}

/** Defines the order direction, either ascending or descending */
export enum OrderDirection {
  asc = 'asc',
  desc = 'desc'
}

export type PayoutClaimed = {
  __typename?: 'PayoutClaimed';
  amount: Scalars['BigInt']['output'];
  betId: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  poolId: Scalars['BigInt']['output'];
  tokenType: TokenType;
  txHash: Scalars['String']['output'];
  user: Scalars['String']['output'];
};

export type PayoutClaimed_filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  amount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  and?: InputMaybe<Array<InputMaybe<PayoutClaimed_filter>>>;
  betId?: InputMaybe<Scalars['BigInt']['input']>;
  betId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  betId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  betId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  betId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  betId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  betId_not?: InputMaybe<Scalars['BigInt']['input']>;
  betId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<PayoutClaimed_filter>>>;
  poolId?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  poolId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_not?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  tokenType?: InputMaybe<TokenType>;
  tokenType_in?: InputMaybe<Array<TokenType>>;
  tokenType_not?: InputMaybe<TokenType>;
  tokenType_not_in?: InputMaybe<Array<TokenType>>;
  txHash?: InputMaybe<Scalars['String']['input']>;
  txHash_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_gt?: InputMaybe<Scalars['String']['input']>;
  txHash_gte?: InputMaybe<Scalars['String']['input']>;
  txHash_in?: InputMaybe<Array<Scalars['String']['input']>>;
  txHash_lt?: InputMaybe<Scalars['String']['input']>;
  txHash_lte?: InputMaybe<Scalars['String']['input']>;
  txHash_not?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  txHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user?: InputMaybe<Scalars['String']['input']>;
  user_contains?: InputMaybe<Scalars['String']['input']>;
  user_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  user_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_gt?: InputMaybe<Scalars['String']['input']>;
  user_gte?: InputMaybe<Scalars['String']['input']>;
  user_in?: InputMaybe<Array<Scalars['String']['input']>>;
  user_lt?: InputMaybe<Scalars['String']['input']>;
  user_lte?: InputMaybe<Scalars['String']['input']>;
  user_not?: InputMaybe<Scalars['String']['input']>;
  user_not_contains?: InputMaybe<Scalars['String']['input']>;
  user_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  user_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  user_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  user_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_starts_with?: InputMaybe<Scalars['String']['input']>;
  user_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum PayoutClaimed_orderBy {
  amount = 'amount',
  betId = 'betId',
  id = 'id',
  poolId = 'poolId',
  tokenType = 'tokenType',
  txHash = 'txHash',
  user = 'user'
}

export type Pool = {
  __typename?: 'Pool';
  betsCloseAt: Scalars['BigInt']['output'];
  category: Scalars['String']['output'];
  closureCriteria: Scalars['String']['output'];
  closureInstructions: Scalars['String']['output'];
  createdAt: Scalars['BigInt']['output'];
  creationTxHash: Scalars['String']['output'];
  creatorId: Scalars['String']['output'];
  creatorName: Scalars['String']['output'];
  decisionTime: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  imageUrl: Scalars['String']['output'];
  isDraw: Scalars['Boolean']['output'];
  options: Array<Scalars['String']['output']>;
  originalTruthSocialPostId: Scalars['String']['output'];
  pointsBetTotals: Scalars['BigInt']['output'];
  pointsBetTotalsByOption: Array<Scalars['BigInt']['output']>;
  poolIntId: Scalars['BigInt']['output'];
  question: Scalars['String']['output'];
  status: PoolStatus;
  twitterPostId: Scalars['String']['output'];
  usdcBetTotals: Scalars['BigInt']['output'];
  usdcBetTotalsByOption: Array<Scalars['BigInt']['output']>;
  winningOption: Scalars['BigInt']['output'];
};

export type PoolClosed = {
  __typename?: 'PoolClosed';
  decisionTime: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  poolId: Scalars['BigInt']['output'];
  selectedOption: Scalars['BigInt']['output'];
  txHash: Scalars['String']['output'];
};

export type PoolClosed_filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<PoolClosed_filter>>>;
  decisionTime?: InputMaybe<Scalars['BigInt']['input']>;
  decisionTime_gt?: InputMaybe<Scalars['BigInt']['input']>;
  decisionTime_gte?: InputMaybe<Scalars['BigInt']['input']>;
  decisionTime_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  decisionTime_lt?: InputMaybe<Scalars['BigInt']['input']>;
  decisionTime_lte?: InputMaybe<Scalars['BigInt']['input']>;
  decisionTime_not?: InputMaybe<Scalars['BigInt']['input']>;
  decisionTime_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<PoolClosed_filter>>>;
  poolId?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  poolId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_not?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  selectedOption?: InputMaybe<Scalars['BigInt']['input']>;
  selectedOption_gt?: InputMaybe<Scalars['BigInt']['input']>;
  selectedOption_gte?: InputMaybe<Scalars['BigInt']['input']>;
  selectedOption_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  selectedOption_lt?: InputMaybe<Scalars['BigInt']['input']>;
  selectedOption_lte?: InputMaybe<Scalars['BigInt']['input']>;
  selectedOption_not?: InputMaybe<Scalars['BigInt']['input']>;
  selectedOption_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  txHash?: InputMaybe<Scalars['String']['input']>;
  txHash_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_gt?: InputMaybe<Scalars['String']['input']>;
  txHash_gte?: InputMaybe<Scalars['String']['input']>;
  txHash_in?: InputMaybe<Array<Scalars['String']['input']>>;
  txHash_lt?: InputMaybe<Scalars['String']['input']>;
  txHash_lte?: InputMaybe<Scalars['String']['input']>;
  txHash_not?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  txHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum PoolClosed_orderBy {
  decisionTime = 'decisionTime',
  id = 'id',
  poolId = 'poolId',
  selectedOption = 'selectedOption',
  txHash = 'txHash'
}

export type PoolCreated = {
  __typename?: 'PoolCreated';
  betsCloseAt: Scalars['BigInt']['output'];
  category: Scalars['String']['output'];
  closureCriteria: Scalars['String']['output'];
  closureInstructions: Scalars['String']['output'];
  createdAt: Scalars['BigInt']['output'];
  creatorId: Scalars['String']['output'];
  creatorName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  imageUrl: Scalars['String']['output'];
  options: Array<Scalars['String']['output']>;
  poolId: Scalars['BigInt']['output'];
  question: Scalars['String']['output'];
  txHash: Scalars['String']['output'];
};

export type PoolCreated_filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<PoolCreated_filter>>>;
  betsCloseAt?: InputMaybe<Scalars['BigInt']['input']>;
  betsCloseAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  betsCloseAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  betsCloseAt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  betsCloseAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  betsCloseAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  betsCloseAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  betsCloseAt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  category?: InputMaybe<Scalars['String']['input']>;
  category_contains?: InputMaybe<Scalars['String']['input']>;
  category_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  category_ends_with?: InputMaybe<Scalars['String']['input']>;
  category_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  category_gt?: InputMaybe<Scalars['String']['input']>;
  category_gte?: InputMaybe<Scalars['String']['input']>;
  category_in?: InputMaybe<Array<Scalars['String']['input']>>;
  category_lt?: InputMaybe<Scalars['String']['input']>;
  category_lte?: InputMaybe<Scalars['String']['input']>;
  category_not?: InputMaybe<Scalars['String']['input']>;
  category_not_contains?: InputMaybe<Scalars['String']['input']>;
  category_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  category_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  category_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  category_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  category_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  category_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  category_starts_with?: InputMaybe<Scalars['String']['input']>;
  category_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  closureCriteria?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_contains?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_ends_with?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_gt?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_gte?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_in?: InputMaybe<Array<Scalars['String']['input']>>;
  closureCriteria_lt?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_lte?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_not?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_not_contains?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  closureCriteria_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_starts_with?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  closureInstructions?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_contains?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_ends_with?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_gt?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_gte?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_in?: InputMaybe<Array<Scalars['String']['input']>>;
  closureInstructions_lt?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_lte?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_not?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_not_contains?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  closureInstructions_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_starts_with?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  createdAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  creatorId?: InputMaybe<Scalars['String']['input']>;
  creatorId_contains?: InputMaybe<Scalars['String']['input']>;
  creatorId_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  creatorId_ends_with?: InputMaybe<Scalars['String']['input']>;
  creatorId_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  creatorId_gt?: InputMaybe<Scalars['String']['input']>;
  creatorId_gte?: InputMaybe<Scalars['String']['input']>;
  creatorId_in?: InputMaybe<Array<Scalars['String']['input']>>;
  creatorId_lt?: InputMaybe<Scalars['String']['input']>;
  creatorId_lte?: InputMaybe<Scalars['String']['input']>;
  creatorId_not?: InputMaybe<Scalars['String']['input']>;
  creatorId_not_contains?: InputMaybe<Scalars['String']['input']>;
  creatorId_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  creatorId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  creatorId_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  creatorId_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  creatorId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  creatorId_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  creatorId_starts_with?: InputMaybe<Scalars['String']['input']>;
  creatorId_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  creatorName?: InputMaybe<Scalars['String']['input']>;
  creatorName_contains?: InputMaybe<Scalars['String']['input']>;
  creatorName_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  creatorName_ends_with?: InputMaybe<Scalars['String']['input']>;
  creatorName_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  creatorName_gt?: InputMaybe<Scalars['String']['input']>;
  creatorName_gte?: InputMaybe<Scalars['String']['input']>;
  creatorName_in?: InputMaybe<Array<Scalars['String']['input']>>;
  creatorName_lt?: InputMaybe<Scalars['String']['input']>;
  creatorName_lte?: InputMaybe<Scalars['String']['input']>;
  creatorName_not?: InputMaybe<Scalars['String']['input']>;
  creatorName_not_contains?: InputMaybe<Scalars['String']['input']>;
  creatorName_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  creatorName_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  creatorName_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  creatorName_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  creatorName_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  creatorName_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  creatorName_starts_with?: InputMaybe<Scalars['String']['input']>;
  creatorName_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  imageUrl_contains?: InputMaybe<Scalars['String']['input']>;
  imageUrl_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  imageUrl_ends_with?: InputMaybe<Scalars['String']['input']>;
  imageUrl_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  imageUrl_gt?: InputMaybe<Scalars['String']['input']>;
  imageUrl_gte?: InputMaybe<Scalars['String']['input']>;
  imageUrl_in?: InputMaybe<Array<Scalars['String']['input']>>;
  imageUrl_lt?: InputMaybe<Scalars['String']['input']>;
  imageUrl_lte?: InputMaybe<Scalars['String']['input']>;
  imageUrl_not?: InputMaybe<Scalars['String']['input']>;
  imageUrl_not_contains?: InputMaybe<Scalars['String']['input']>;
  imageUrl_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  imageUrl_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  imageUrl_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  imageUrl_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  imageUrl_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  imageUrl_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  imageUrl_starts_with?: InputMaybe<Scalars['String']['input']>;
  imageUrl_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  options?: InputMaybe<Array<Scalars['String']['input']>>;
  options_contains?: InputMaybe<Array<Scalars['String']['input']>>;
  options_contains_nocase?: InputMaybe<Array<Scalars['String']['input']>>;
  options_not?: InputMaybe<Array<Scalars['String']['input']>>;
  options_not_contains?: InputMaybe<Array<Scalars['String']['input']>>;
  options_not_contains_nocase?: InputMaybe<Array<Scalars['String']['input']>>;
  or?: InputMaybe<Array<InputMaybe<PoolCreated_filter>>>;
  poolId?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  poolId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_not?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  question?: InputMaybe<Scalars['String']['input']>;
  question_contains?: InputMaybe<Scalars['String']['input']>;
  question_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  question_ends_with?: InputMaybe<Scalars['String']['input']>;
  question_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  question_gt?: InputMaybe<Scalars['String']['input']>;
  question_gte?: InputMaybe<Scalars['String']['input']>;
  question_in?: InputMaybe<Array<Scalars['String']['input']>>;
  question_lt?: InputMaybe<Scalars['String']['input']>;
  question_lte?: InputMaybe<Scalars['String']['input']>;
  question_not?: InputMaybe<Scalars['String']['input']>;
  question_not_contains?: InputMaybe<Scalars['String']['input']>;
  question_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  question_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  question_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  question_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  question_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  question_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  question_starts_with?: InputMaybe<Scalars['String']['input']>;
  question_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash?: InputMaybe<Scalars['String']['input']>;
  txHash_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_gt?: InputMaybe<Scalars['String']['input']>;
  txHash_gte?: InputMaybe<Scalars['String']['input']>;
  txHash_in?: InputMaybe<Array<Scalars['String']['input']>>;
  txHash_lt?: InputMaybe<Scalars['String']['input']>;
  txHash_lte?: InputMaybe<Scalars['String']['input']>;
  txHash_not?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  txHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum PoolCreated_orderBy {
  betsCloseAt = 'betsCloseAt',
  category = 'category',
  closureCriteria = 'closureCriteria',
  closureInstructions = 'closureInstructions',
  createdAt = 'createdAt',
  creatorId = 'creatorId',
  creatorName = 'creatorName',
  id = 'id',
  imageUrl = 'imageUrl',
  options = 'options',
  poolId = 'poolId',
  question = 'question',
  txHash = 'txHash'
}

export type PoolMediaSet = {
  __typename?: 'PoolMediaSet';
  id: Scalars['ID']['output'];
  imageUrl: Scalars['String']['output'];
  pool: Pool;
  poolId: Scalars['BigInt']['output'];
  txHash: Scalars['String']['output'];
};

export type PoolMediaSet_filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<PoolMediaSet_filter>>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  imageUrl_contains?: InputMaybe<Scalars['String']['input']>;
  imageUrl_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  imageUrl_ends_with?: InputMaybe<Scalars['String']['input']>;
  imageUrl_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  imageUrl_gt?: InputMaybe<Scalars['String']['input']>;
  imageUrl_gte?: InputMaybe<Scalars['String']['input']>;
  imageUrl_in?: InputMaybe<Array<Scalars['String']['input']>>;
  imageUrl_lt?: InputMaybe<Scalars['String']['input']>;
  imageUrl_lte?: InputMaybe<Scalars['String']['input']>;
  imageUrl_not?: InputMaybe<Scalars['String']['input']>;
  imageUrl_not_contains?: InputMaybe<Scalars['String']['input']>;
  imageUrl_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  imageUrl_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  imageUrl_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  imageUrl_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  imageUrl_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  imageUrl_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  imageUrl_starts_with?: InputMaybe<Scalars['String']['input']>;
  imageUrl_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  or?: InputMaybe<Array<InputMaybe<PoolMediaSet_filter>>>;
  pool?: InputMaybe<Scalars['String']['input']>;
  poolId?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  poolId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_not?: InputMaybe<Scalars['BigInt']['input']>;
  poolId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  pool_?: InputMaybe<Pool_filter>;
  pool_contains?: InputMaybe<Scalars['String']['input']>;
  pool_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_gt?: InputMaybe<Scalars['String']['input']>;
  pool_gte?: InputMaybe<Scalars['String']['input']>;
  pool_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_lt?: InputMaybe<Scalars['String']['input']>;
  pool_lte?: InputMaybe<Scalars['String']['input']>;
  pool_not?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash?: InputMaybe<Scalars['String']['input']>;
  txHash_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_gt?: InputMaybe<Scalars['String']['input']>;
  txHash_gte?: InputMaybe<Scalars['String']['input']>;
  txHash_in?: InputMaybe<Array<Scalars['String']['input']>>;
  txHash_lt?: InputMaybe<Scalars['String']['input']>;
  txHash_lte?: InputMaybe<Scalars['String']['input']>;
  txHash_not?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  txHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum PoolMediaSet_orderBy {
  id = 'id',
  imageUrl = 'imageUrl',
  pool = 'pool',
  poolId = 'poolId',
  pool__betsCloseAt = 'pool__betsCloseAt',
  pool__category = 'pool__category',
  pool__closureCriteria = 'pool__closureCriteria',
  pool__closureInstructions = 'pool__closureInstructions',
  pool__createdAt = 'pool__createdAt',
  pool__creationTxHash = 'pool__creationTxHash',
  pool__creatorId = 'pool__creatorId',
  pool__creatorName = 'pool__creatorName',
  pool__decisionTime = 'pool__decisionTime',
  pool__id = 'pool__id',
  pool__imageUrl = 'pool__imageUrl',
  pool__isDraw = 'pool__isDraw',
  pool__originalTruthSocialPostId = 'pool__originalTruthSocialPostId',
  pool__pointsBetTotals = 'pool__pointsBetTotals',
  pool__poolIntId = 'pool__poolIntId',
  pool__question = 'pool__question',
  pool__status = 'pool__status',
  pool__twitterPostId = 'pool__twitterPostId',
  pool__usdcBetTotals = 'pool__usdcBetTotals',
  pool__winningOption = 'pool__winningOption',
  txHash = 'txHash'
}

export enum PoolStatus {
  Graded = 'Graded',
  None = 'None',
  Pending = 'Pending',
  Regraded = 'Regraded'
}

export type Pool_filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Pool_filter>>>;
  betsCloseAt?: InputMaybe<Scalars['BigInt']['input']>;
  betsCloseAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  betsCloseAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  betsCloseAt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  betsCloseAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  betsCloseAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  betsCloseAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  betsCloseAt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  category?: InputMaybe<Scalars['String']['input']>;
  category_contains?: InputMaybe<Scalars['String']['input']>;
  category_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  category_ends_with?: InputMaybe<Scalars['String']['input']>;
  category_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  category_gt?: InputMaybe<Scalars['String']['input']>;
  category_gte?: InputMaybe<Scalars['String']['input']>;
  category_in?: InputMaybe<Array<Scalars['String']['input']>>;
  category_lt?: InputMaybe<Scalars['String']['input']>;
  category_lte?: InputMaybe<Scalars['String']['input']>;
  category_not?: InputMaybe<Scalars['String']['input']>;
  category_not_contains?: InputMaybe<Scalars['String']['input']>;
  category_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  category_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  category_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  category_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  category_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  category_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  category_starts_with?: InputMaybe<Scalars['String']['input']>;
  category_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  closureCriteria?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_contains?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_ends_with?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_gt?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_gte?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_in?: InputMaybe<Array<Scalars['String']['input']>>;
  closureCriteria_lt?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_lte?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_not?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_not_contains?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  closureCriteria_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_starts_with?: InputMaybe<Scalars['String']['input']>;
  closureCriteria_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  closureInstructions?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_contains?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_ends_with?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_gt?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_gte?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_in?: InputMaybe<Array<Scalars['String']['input']>>;
  closureInstructions_lt?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_lte?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_not?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_not_contains?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  closureInstructions_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_starts_with?: InputMaybe<Scalars['String']['input']>;
  closureInstructions_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  createdAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  creationTxHash?: InputMaybe<Scalars['String']['input']>;
  creationTxHash_contains?: InputMaybe<Scalars['String']['input']>;
  creationTxHash_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  creationTxHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  creationTxHash_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  creationTxHash_gt?: InputMaybe<Scalars['String']['input']>;
  creationTxHash_gte?: InputMaybe<Scalars['String']['input']>;
  creationTxHash_in?: InputMaybe<Array<Scalars['String']['input']>>;
  creationTxHash_lt?: InputMaybe<Scalars['String']['input']>;
  creationTxHash_lte?: InputMaybe<Scalars['String']['input']>;
  creationTxHash_not?: InputMaybe<Scalars['String']['input']>;
  creationTxHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  creationTxHash_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  creationTxHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  creationTxHash_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  creationTxHash_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  creationTxHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  creationTxHash_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  creationTxHash_starts_with?: InputMaybe<Scalars['String']['input']>;
  creationTxHash_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  creatorId?: InputMaybe<Scalars['String']['input']>;
  creatorId_contains?: InputMaybe<Scalars['String']['input']>;
  creatorId_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  creatorId_ends_with?: InputMaybe<Scalars['String']['input']>;
  creatorId_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  creatorId_gt?: InputMaybe<Scalars['String']['input']>;
  creatorId_gte?: InputMaybe<Scalars['String']['input']>;
  creatorId_in?: InputMaybe<Array<Scalars['String']['input']>>;
  creatorId_lt?: InputMaybe<Scalars['String']['input']>;
  creatorId_lte?: InputMaybe<Scalars['String']['input']>;
  creatorId_not?: InputMaybe<Scalars['String']['input']>;
  creatorId_not_contains?: InputMaybe<Scalars['String']['input']>;
  creatorId_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  creatorId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  creatorId_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  creatorId_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  creatorId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  creatorId_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  creatorId_starts_with?: InputMaybe<Scalars['String']['input']>;
  creatorId_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  creatorName?: InputMaybe<Scalars['String']['input']>;
  creatorName_contains?: InputMaybe<Scalars['String']['input']>;
  creatorName_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  creatorName_ends_with?: InputMaybe<Scalars['String']['input']>;
  creatorName_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  creatorName_gt?: InputMaybe<Scalars['String']['input']>;
  creatorName_gte?: InputMaybe<Scalars['String']['input']>;
  creatorName_in?: InputMaybe<Array<Scalars['String']['input']>>;
  creatorName_lt?: InputMaybe<Scalars['String']['input']>;
  creatorName_lte?: InputMaybe<Scalars['String']['input']>;
  creatorName_not?: InputMaybe<Scalars['String']['input']>;
  creatorName_not_contains?: InputMaybe<Scalars['String']['input']>;
  creatorName_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  creatorName_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  creatorName_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  creatorName_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  creatorName_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  creatorName_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  creatorName_starts_with?: InputMaybe<Scalars['String']['input']>;
  creatorName_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  decisionTime?: InputMaybe<Scalars['BigInt']['input']>;
  decisionTime_gt?: InputMaybe<Scalars['BigInt']['input']>;
  decisionTime_gte?: InputMaybe<Scalars['BigInt']['input']>;
  decisionTime_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  decisionTime_lt?: InputMaybe<Scalars['BigInt']['input']>;
  decisionTime_lte?: InputMaybe<Scalars['BigInt']['input']>;
  decisionTime_not?: InputMaybe<Scalars['BigInt']['input']>;
  decisionTime_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  imageUrl_contains?: InputMaybe<Scalars['String']['input']>;
  imageUrl_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  imageUrl_ends_with?: InputMaybe<Scalars['String']['input']>;
  imageUrl_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  imageUrl_gt?: InputMaybe<Scalars['String']['input']>;
  imageUrl_gte?: InputMaybe<Scalars['String']['input']>;
  imageUrl_in?: InputMaybe<Array<Scalars['String']['input']>>;
  imageUrl_lt?: InputMaybe<Scalars['String']['input']>;
  imageUrl_lte?: InputMaybe<Scalars['String']['input']>;
  imageUrl_not?: InputMaybe<Scalars['String']['input']>;
  imageUrl_not_contains?: InputMaybe<Scalars['String']['input']>;
  imageUrl_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  imageUrl_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  imageUrl_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  imageUrl_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  imageUrl_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  imageUrl_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  imageUrl_starts_with?: InputMaybe<Scalars['String']['input']>;
  imageUrl_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  isDraw?: InputMaybe<Scalars['Boolean']['input']>;
  isDraw_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  isDraw_not?: InputMaybe<Scalars['Boolean']['input']>;
  isDraw_not_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  options?: InputMaybe<Array<Scalars['String']['input']>>;
  options_contains?: InputMaybe<Array<Scalars['String']['input']>>;
  options_contains_nocase?: InputMaybe<Array<Scalars['String']['input']>>;
  options_not?: InputMaybe<Array<Scalars['String']['input']>>;
  options_not_contains?: InputMaybe<Array<Scalars['String']['input']>>;
  options_not_contains_nocase?: InputMaybe<Array<Scalars['String']['input']>>;
  or?: InputMaybe<Array<InputMaybe<Pool_filter>>>;
  originalTruthSocialPostId?: InputMaybe<Scalars['String']['input']>;
  originalTruthSocialPostId_contains?: InputMaybe<Scalars['String']['input']>;
  originalTruthSocialPostId_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  originalTruthSocialPostId_ends_with?: InputMaybe<Scalars['String']['input']>;
  originalTruthSocialPostId_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  originalTruthSocialPostId_gt?: InputMaybe<Scalars['String']['input']>;
  originalTruthSocialPostId_gte?: InputMaybe<Scalars['String']['input']>;
  originalTruthSocialPostId_in?: InputMaybe<Array<Scalars['String']['input']>>;
  originalTruthSocialPostId_lt?: InputMaybe<Scalars['String']['input']>;
  originalTruthSocialPostId_lte?: InputMaybe<Scalars['String']['input']>;
  originalTruthSocialPostId_not?: InputMaybe<Scalars['String']['input']>;
  originalTruthSocialPostId_not_contains?: InputMaybe<Scalars['String']['input']>;
  originalTruthSocialPostId_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  originalTruthSocialPostId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  originalTruthSocialPostId_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  originalTruthSocialPostId_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  originalTruthSocialPostId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  originalTruthSocialPostId_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  originalTruthSocialPostId_starts_with?: InputMaybe<Scalars['String']['input']>;
  originalTruthSocialPostId_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pointsBetTotals?: InputMaybe<Scalars['BigInt']['input']>;
  pointsBetTotalsByOption?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  pointsBetTotalsByOption_contains?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  pointsBetTotalsByOption_contains_nocase?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  pointsBetTotalsByOption_not?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  pointsBetTotalsByOption_not_contains?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  pointsBetTotalsByOption_not_contains_nocase?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  pointsBetTotals_gt?: InputMaybe<Scalars['BigInt']['input']>;
  pointsBetTotals_gte?: InputMaybe<Scalars['BigInt']['input']>;
  pointsBetTotals_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  pointsBetTotals_lt?: InputMaybe<Scalars['BigInt']['input']>;
  pointsBetTotals_lte?: InputMaybe<Scalars['BigInt']['input']>;
  pointsBetTotals_not?: InputMaybe<Scalars['BigInt']['input']>;
  pointsBetTotals_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  poolIntId?: InputMaybe<Scalars['BigInt']['input']>;
  poolIntId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  poolIntId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  poolIntId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  poolIntId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  poolIntId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  poolIntId_not?: InputMaybe<Scalars['BigInt']['input']>;
  poolIntId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  question?: InputMaybe<Scalars['String']['input']>;
  question_contains?: InputMaybe<Scalars['String']['input']>;
  question_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  question_ends_with?: InputMaybe<Scalars['String']['input']>;
  question_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  question_gt?: InputMaybe<Scalars['String']['input']>;
  question_gte?: InputMaybe<Scalars['String']['input']>;
  question_in?: InputMaybe<Array<Scalars['String']['input']>>;
  question_lt?: InputMaybe<Scalars['String']['input']>;
  question_lte?: InputMaybe<Scalars['String']['input']>;
  question_not?: InputMaybe<Scalars['String']['input']>;
  question_not_contains?: InputMaybe<Scalars['String']['input']>;
  question_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  question_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  question_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  question_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  question_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  question_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  question_starts_with?: InputMaybe<Scalars['String']['input']>;
  question_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<PoolStatus>;
  status_in?: InputMaybe<Array<PoolStatus>>;
  status_not?: InputMaybe<PoolStatus>;
  status_not_in?: InputMaybe<Array<PoolStatus>>;
  twitterPostId?: InputMaybe<Scalars['String']['input']>;
  twitterPostId_contains?: InputMaybe<Scalars['String']['input']>;
  twitterPostId_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  twitterPostId_ends_with?: InputMaybe<Scalars['String']['input']>;
  twitterPostId_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  twitterPostId_gt?: InputMaybe<Scalars['String']['input']>;
  twitterPostId_gte?: InputMaybe<Scalars['String']['input']>;
  twitterPostId_in?: InputMaybe<Array<Scalars['String']['input']>>;
  twitterPostId_lt?: InputMaybe<Scalars['String']['input']>;
  twitterPostId_lte?: InputMaybe<Scalars['String']['input']>;
  twitterPostId_not?: InputMaybe<Scalars['String']['input']>;
  twitterPostId_not_contains?: InputMaybe<Scalars['String']['input']>;
  twitterPostId_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  twitterPostId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  twitterPostId_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  twitterPostId_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  twitterPostId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  twitterPostId_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  twitterPostId_starts_with?: InputMaybe<Scalars['String']['input']>;
  twitterPostId_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  usdcBetTotals?: InputMaybe<Scalars['BigInt']['input']>;
  usdcBetTotalsByOption?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  usdcBetTotalsByOption_contains?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  usdcBetTotalsByOption_contains_nocase?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  usdcBetTotalsByOption_not?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  usdcBetTotalsByOption_not_contains?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  usdcBetTotalsByOption_not_contains_nocase?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  usdcBetTotals_gt?: InputMaybe<Scalars['BigInt']['input']>;
  usdcBetTotals_gte?: InputMaybe<Scalars['BigInt']['input']>;
  usdcBetTotals_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  usdcBetTotals_lt?: InputMaybe<Scalars['BigInt']['input']>;
  usdcBetTotals_lte?: InputMaybe<Scalars['BigInt']['input']>;
  usdcBetTotals_not?: InputMaybe<Scalars['BigInt']['input']>;
  usdcBetTotals_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  winningOption?: InputMaybe<Scalars['BigInt']['input']>;
  winningOption_gt?: InputMaybe<Scalars['BigInt']['input']>;
  winningOption_gte?: InputMaybe<Scalars['BigInt']['input']>;
  winningOption_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  winningOption_lt?: InputMaybe<Scalars['BigInt']['input']>;
  winningOption_lte?: InputMaybe<Scalars['BigInt']['input']>;
  winningOption_not?: InputMaybe<Scalars['BigInt']['input']>;
  winningOption_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
};

export enum Pool_orderBy {
  betsCloseAt = 'betsCloseAt',
  category = 'category',
  closureCriteria = 'closureCriteria',
  closureInstructions = 'closureInstructions',
  createdAt = 'createdAt',
  creationTxHash = 'creationTxHash',
  creatorId = 'creatorId',
  creatorName = 'creatorName',
  decisionTime = 'decisionTime',
  id = 'id',
  imageUrl = 'imageUrl',
  isDraw = 'isDraw',
  options = 'options',
  originalTruthSocialPostId = 'originalTruthSocialPostId',
  pointsBetTotals = 'pointsBetTotals',
  pointsBetTotalsByOption = 'pointsBetTotalsByOption',
  poolIntId = 'poolIntId',
  question = 'question',
  status = 'status',
  twitterPostId = 'twitterPostId',
  usdcBetTotals = 'usdcBetTotals',
  usdcBetTotalsByOption = 'usdcBetTotalsByOption',
  winningOption = 'winningOption'
}

export type Query = {
  __typename?: 'Query';
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>;
  bet?: Maybe<Bet>;
  betPlaced?: Maybe<BetPlaced>;
  betPlaceds: Array<BetPlaced>;
  bets: Array<Bet>;
  payoutClaimed?: Maybe<PayoutClaimed>;
  payoutClaimeds: Array<PayoutClaimed>;
  pool?: Maybe<Pool>;
  poolClosed?: Maybe<PoolClosed>;
  poolCloseds: Array<PoolClosed>;
  poolCreated?: Maybe<PoolCreated>;
  poolCreateds: Array<PoolCreated>;
  poolMediaSet?: Maybe<PoolMediaSet>;
  poolMediaSets: Array<PoolMediaSet>;
  pools: Array<Pool>;
};


export type Query_metaArgs = {
  block?: InputMaybe<Block_height>;
};


export type QuerybetArgs = {
  block?: InputMaybe<Block_height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerybetPlacedArgs = {
  block?: InputMaybe<Block_height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerybetPlacedsArgs = {
  block?: InputMaybe<Block_height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<BetPlaced_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<BetPlaced_filter>;
};


export type QuerybetsArgs = {
  block?: InputMaybe<Block_height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Bet_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Bet_filter>;
};


export type QuerypayoutClaimedArgs = {
  block?: InputMaybe<Block_height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerypayoutClaimedsArgs = {
  block?: InputMaybe<Block_height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<PayoutClaimed_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<PayoutClaimed_filter>;
};


export type QuerypoolArgs = {
  block?: InputMaybe<Block_height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerypoolClosedArgs = {
  block?: InputMaybe<Block_height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerypoolClosedsArgs = {
  block?: InputMaybe<Block_height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<PoolClosed_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<PoolClosed_filter>;
};


export type QuerypoolCreatedArgs = {
  block?: InputMaybe<Block_height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerypoolCreatedsArgs = {
  block?: InputMaybe<Block_height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<PoolCreated_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<PoolCreated_filter>;
};


export type QuerypoolMediaSetArgs = {
  block?: InputMaybe<Block_height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerypoolMediaSetsArgs = {
  block?: InputMaybe<Block_height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<PoolMediaSet_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<PoolMediaSet_filter>;
};


export type QuerypoolsArgs = {
  block?: InputMaybe<Block_height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Pool_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Pool_filter>;
};

export enum TokenType {
  Freedom = 'Freedom',
  USDC = 'USDC'
}

export type _Block_ = {
  __typename?: '_Block_';
  /** The hash of the block */
  hash?: Maybe<Scalars['Bytes']['output']>;
  /** The block number */
  number: Scalars['Int']['output'];
  /** The hash of the parent block */
  parentHash?: Maybe<Scalars['Bytes']['output']>;
  /** Integer representation of the timestamp stored in blocks for the chain */
  timestamp?: Maybe<Scalars['Int']['output']>;
};

/** The type for the top-level _meta field */
export type _Meta_ = {
  __typename?: '_Meta_';
  /**
   * Information about a specific subgraph block. The hash of the block
   * will be null if the _meta field has a block constraint that asks for
   * a block number. It will be filled if the _meta field has no block constraint
   * and therefore asks for the latest  block
   *
   */
  block: _Block_;
  /** The deployment ID */
  deployment: Scalars['String']['output'];
  /** If `true`, the subgraph encountered indexing errors at some past block */
  hasIndexingErrors: Scalars['Boolean']['output'];
};

export enum _SubgraphErrorPolicy_ {
  /** Data will be returned even if the subgraph has indexing errors */
  allow = 'allow',
  /** If the subgraph has indexing errors, data will be omitted. The default. */
  deny = 'deny'
}
