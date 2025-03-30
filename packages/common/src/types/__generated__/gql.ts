/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
  '\n  query GetPools(\n    $filter: Pool_filter!\n    $orderBy: Pool_orderBy!\n    $orderDirection: OrderDirection!\n    $first: Int\n  ) {\n    pools(where: $filter, orderBy: $orderBy, orderDirection: $orderDirection, first: $first) {\n      id\n      poolId\n      question\n      options\n      status\n      chainId\n      chainName\n      createdAt\n      createdBlockNumber\n      createdBlockTimestamp\n      createdTransactionHash\n      lastUpdatedBlockNumber\n      lastUpdatedBlockTimestamp\n      lastUpdatedTransactionHash\n      gradedBlockNumber\n      gradedBlockTimestamp\n      gradedTransactionHash\n      betsCloseAt\n      usdcBetTotals\n      pointsBetTotals\n      usdcVolume\n      pointsVolume\n      originalTruthSocialPostId\n    }\n  }\n': typeof types.GetPoolsDocument;
  '\n            query fetchPool {\n              pool(id: "") {\n                id\n                status\n                question\n                options\n                betsCloseAt\n                closureCriteria\n                closureInstructions\n                usdcBetTotals\n                pointsBetTotals\n                originalTruthSocialPostId\n              }\n            }\n          ': typeof types.FetchPoolDocument;
  '\n  query fetchPendingPools {\n    pools(where: { status: PENDING }) {\n      id\n      status\n      question\n      options\n      betsCloseAt\n      closureCriteria\n      closureInstructions\n      usdcBetTotals\n      pointsBetTotals\n      originalTruthSocialPostId\n    }\n  }\n': typeof types.FetchPendingPoolsDocument;
  '\n  query GetPools(\n    $filter: Pool_filter!\n    $orderBy: Pool_orderBy!\n    $orderDirection: OrderDirection!\n    $first: Int\n  ) {\n    pools(\n      where: $filter\n      orderBy: $orderBy\n      orderDirection: $orderDirection\n      first: $first\n    ) {\n        id\n        poolId\n        question\n        options\n        status\n        chainId\n        chainName\n        createdAt\n        createdBlockNumber\n        createdBlockTimestamp\n        createdTransactionHash\n        lastUpdatedBlockNumber\n        lastUpdatedBlockTimestamp\n        lastUpdatedTransactionHash\n        gradedBlockNumber\n        gradedBlockTimestamp\n        gradedTransactionHash\n        betsCloseAt\n        usdcBetTotals\n        pointsBetTotals\n        usdcVolume\n        pointsVolume\n        originalTruthSocialPostId\n    }\n  }\n': typeof types.GetPoolsDocument;
  '\n  subscription GetPoolsSubscription(\n    $filter: Pool_filter!\n  ) {\n    pools(\n      where: $filter\n    ) {\n        id\n        poolId\n        question\n        options\n        status\n        chainId\n        chainName\n        createdAt\n        createdBlockNumber\n        createdBlockTimestamp\n        createdTransactionHash\n        lastUpdatedBlockNumber\n        lastUpdatedBlockTimestamp\n        lastUpdatedTransactionHash\n        gradedBlockNumber\n        gradedBlockTimestamp\n        gradedTransactionHash\n    }\n  }\n': typeof types.GetPoolsSubscriptionDocument;
  '\n  query GetBetPlaced(\n    $first: Int = 10\n    $filter: BetPlaced_filter!\n    $orderBy: BetPlaced_orderBy!\n    $orderDirection: OrderDirection!\n  ) {\n    betPlaceds(\n      first: $first\n      where: $filter\n      orderBy: $orderBy\n      orderDirection: $orderDirection\n    ) {\n      id\n      betId\n      optionIndex\n      amount\n      poolId\n      blockNumber\n      blockTimestamp\n      transactionHash\n    }\n  }\n': typeof types.GetBetPlacedDocument;
  '\n  query GetBets(\n    $first: Int = 10\n    $filter: Bet_filter!\n    $orderBy: Bet_orderBy!\n    $orderDirection: OrderDirection!\n  ) {\n    bets(\n      first: $first\n      where: $filter\n      orderBy: $orderBy\n      orderDirection: $orderDirection\n    ) {\n      id\n      betId\n      option\n      amount\n      poolId\n      blockNumber\n      blockTimestamp\n      transactionHash\n      pool {\n        id\n        poolId\n        question\n        options\n        status\n        chainId\n        chainName\n        createdAt\n      }\n    }\n  }\n': typeof types.GetBetsDocument;
  '\n  subscription GetBetsSubscription(\n    $filter: Bet_filter!\n  ) {\n    bets(\n      where: $filter\n    ) {\n      id\n      betId\n      option\n      amount\n      poolId\n      blockNumber\n      blockTimestamp\n      transactionHash\n      pool {\n        id\n        poolId\n        question\n        options\n        status\n        chainId\n        chainName\n        createdAt\n      }\n    }\n  }\n': typeof types.GetBetsSubscriptionDocument;
  '\n  query GetPool($poolId: ID!) {\n    pool(id: $poolId) {\n      id\n      poolId\n      question\n      options\n      status\n      chainId\n      chainName\n      createdAt\n      createdBlockNumber\n      createdBlockTimestamp\n      createdTransactionHash\n      gradedBlockNumber\n      gradedBlockTimestamp\n      gradedTransactionHash\n      betsCloseAt\n      usdcBetTotals\n      pointsBetTotals\n      usdcVolume\n      pointsVolume\n      winningOption\n    }\n  }\n': typeof types.GetPoolDocument;
  '\n  subscription GetPoolSubscription($poolId: ID!) {\n    pool(id: $poolId) {\n      id\n      poolId\n      question\n      options\n      status\n      chainId\n      chainName\n      createdAt\n      createdBlockNumber\n      createdBlockTimestamp\n      createdTransactionHash\n      gradedBlockNumber\n      gradedBlockTimestamp\n      gradedTransactionHash\n    }\n  }\n': typeof types.GetPoolSubscriptionDocument;
};
const documents: Documents = {
  '\n  query GetPools(\n    $filter: Pool_filter!\n    $orderBy: Pool_orderBy!\n    $orderDirection: OrderDirection!\n    $first: Int\n  ) {\n    pools(where: $filter, orderBy: $orderBy, orderDirection: $orderDirection, first: $first) {\n      id\n      poolId\n      question\n      options\n      status\n      chainId\n      chainName\n      createdAt\n      createdBlockNumber\n      createdBlockTimestamp\n      createdTransactionHash\n      lastUpdatedBlockNumber\n      lastUpdatedBlockTimestamp\n      lastUpdatedTransactionHash\n      gradedBlockNumber\n      gradedBlockTimestamp\n      gradedTransactionHash\n      betsCloseAt\n      usdcBetTotals\n      pointsBetTotals\n      usdcVolume\n      pointsVolume\n      originalTruthSocialPostId\n    }\n  }\n':
    types.GetPoolsDocument,
  '\n            query fetchPool {\n              pool(id: "") {\n                id\n                status\n                question\n                options\n                betsCloseAt\n                closureCriteria\n                closureInstructions\n                usdcBetTotals\n                pointsBetTotals\n                originalTruthSocialPostId\n              }\n            }\n          ':
    types.FetchPoolDocument,
  '\n  query fetchPendingPools {\n    pools(where: { status: PENDING }) {\n      id\n      status\n      question\n      options\n      betsCloseAt\n      closureCriteria\n      closureInstructions\n      usdcBetTotals\n      pointsBetTotals\n      originalTruthSocialPostId\n    }\n  }\n':
    types.FetchPendingPoolsDocument,
  '\n  query GetPools(\n    $filter: Pool_filter!\n    $orderBy: Pool_orderBy!\n    $orderDirection: OrderDirection!\n    $first: Int\n  ) {\n    pools(\n      where: $filter\n      orderBy: $orderBy\n      orderDirection: $orderDirection\n      first: $first\n    ) {\n        id\n        poolId\n        question\n        options\n        status\n        chainId\n        chainName\n        createdAt\n        createdBlockNumber\n        createdBlockTimestamp\n        createdTransactionHash\n        lastUpdatedBlockNumber\n        lastUpdatedBlockTimestamp\n        lastUpdatedTransactionHash\n        gradedBlockNumber\n        gradedBlockTimestamp\n        gradedTransactionHash\n        betsCloseAt\n        usdcBetTotals\n        pointsBetTotals\n        usdcVolume\n        pointsVolume\n        originalTruthSocialPostId\n    }\n  }\n':
    types.GetPoolsDocument,
  '\n  subscription GetPoolsSubscription(\n    $filter: Pool_filter!\n  ) {\n    pools(\n      where: $filter\n    ) {\n        id\n        poolId\n        question\n        options\n        status\n        chainId\n        chainName\n        createdAt\n        createdBlockNumber\n        createdBlockTimestamp\n        createdTransactionHash\n        lastUpdatedBlockNumber\n        lastUpdatedBlockTimestamp\n        lastUpdatedTransactionHash\n        gradedBlockNumber\n        gradedBlockTimestamp\n        gradedTransactionHash\n    }\n  }\n':
    types.GetPoolsSubscriptionDocument,
  '\n  query GetBetPlaced(\n    $first: Int = 10\n    $filter: BetPlaced_filter!\n    $orderBy: BetPlaced_orderBy!\n    $orderDirection: OrderDirection!\n  ) {\n    betPlaceds(\n      first: $first\n      where: $filter\n      orderBy: $orderBy\n      orderDirection: $orderDirection\n    ) {\n      id\n      betId\n      optionIndex\n      amount\n      poolId\n      blockNumber\n      blockTimestamp\n      transactionHash\n    }\n  }\n':
    types.GetBetPlacedDocument,
  '\n  query GetBets(\n    $first: Int = 10\n    $filter: Bet_filter!\n    $orderBy: Bet_orderBy!\n    $orderDirection: OrderDirection!\n  ) {\n    bets(\n      first: $first\n      where: $filter\n      orderBy: $orderBy\n      orderDirection: $orderDirection\n    ) {\n      id\n      betId\n      option\n      amount\n      poolId\n      blockNumber\n      blockTimestamp\n      transactionHash\n      pool {\n        id\n        poolId\n        question\n        options\n        status\n        chainId\n        chainName\n        createdAt\n      }\n    }\n  }\n':
    types.GetBetsDocument,
  '\n  subscription GetBetsSubscription(\n    $filter: Bet_filter!\n  ) {\n    bets(\n      where: $filter\n    ) {\n      id\n      betId\n      option\n      amount\n      poolId\n      blockNumber\n      blockTimestamp\n      transactionHash\n      pool {\n        id\n        poolId\n        question\n        options\n        status\n        chainId\n        chainName\n        createdAt\n      }\n    }\n  }\n':
    types.GetBetsSubscriptionDocument,
  '\n  query GetPool($poolId: ID!) {\n    pool(id: $poolId) {\n      id\n      poolId\n      question\n      options\n      status\n      chainId\n      chainName\n      createdAt\n      createdBlockNumber\n      createdBlockTimestamp\n      createdTransactionHash\n      gradedBlockNumber\n      gradedBlockTimestamp\n      gradedTransactionHash\n      betsCloseAt\n      usdcBetTotals\n      pointsBetTotals\n      usdcVolume\n      pointsVolume\n      winningOption\n    }\n  }\n':
    types.GetPoolDocument,
  '\n  subscription GetPoolSubscription($poolId: ID!) {\n    pool(id: $poolId) {\n      id\n      poolId\n      question\n      options\n      status\n      chainId\n      chainName\n      createdAt\n      createdBlockNumber\n      createdBlockTimestamp\n      createdTransactionHash\n      gradedBlockNumber\n      gradedBlockTimestamp\n      gradedTransactionHash\n    }\n  }\n':
    types.GetPoolSubscriptionDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown;

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query GetPools(\n    $filter: Pool_filter!\n    $orderBy: Pool_orderBy!\n    $orderDirection: OrderDirection!\n    $first: Int\n  ) {\n    pools(where: $filter, orderBy: $orderBy, orderDirection: $orderDirection, first: $first) {\n      id\n      poolId\n      question\n      options\n      status\n      chainId\n      chainName\n      createdAt\n      createdBlockNumber\n      createdBlockTimestamp\n      createdTransactionHash\n      lastUpdatedBlockNumber\n      lastUpdatedBlockTimestamp\n      lastUpdatedTransactionHash\n      gradedBlockNumber\n      gradedBlockTimestamp\n      gradedTransactionHash\n      betsCloseAt\n      usdcBetTotals\n      pointsBetTotals\n      usdcVolume\n      pointsVolume\n      originalTruthSocialPostId\n    }\n  }\n'
): (typeof documents)['\n  query GetPools(\n    $filter: Pool_filter!\n    $orderBy: Pool_orderBy!\n    $orderDirection: OrderDirection!\n    $first: Int\n  ) {\n    pools(where: $filter, orderBy: $orderBy, orderDirection: $orderDirection, first: $first) {\n      id\n      poolId\n      question\n      options\n      status\n      chainId\n      chainName\n      createdAt\n      createdBlockNumber\n      createdBlockTimestamp\n      createdTransactionHash\n      lastUpdatedBlockNumber\n      lastUpdatedBlockTimestamp\n      lastUpdatedTransactionHash\n      gradedBlockNumber\n      gradedBlockTimestamp\n      gradedTransactionHash\n      betsCloseAt\n      usdcBetTotals\n      pointsBetTotals\n      usdcVolume\n      pointsVolume\n      originalTruthSocialPostId\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n            query fetchPool {\n              pool(id: "") {\n                id\n                status\n                question\n                options\n                betsCloseAt\n                closureCriteria\n                closureInstructions\n                usdcBetTotals\n                pointsBetTotals\n                originalTruthSocialPostId\n              }\n            }\n          '
): (typeof documents)['\n            query fetchPool {\n              pool(id: "") {\n                id\n                status\n                question\n                options\n                betsCloseAt\n                closureCriteria\n                closureInstructions\n                usdcBetTotals\n                pointsBetTotals\n                originalTruthSocialPostId\n              }\n            }\n          '];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query fetchPendingPools {\n    pools(where: { status: PENDING }) {\n      id\n      status\n      question\n      options\n      betsCloseAt\n      closureCriteria\n      closureInstructions\n      usdcBetTotals\n      pointsBetTotals\n      originalTruthSocialPostId\n    }\n  }\n'
): (typeof documents)['\n  query fetchPendingPools {\n    pools(where: { status: PENDING }) {\n      id\n      status\n      question\n      options\n      betsCloseAt\n      closureCriteria\n      closureInstructions\n      usdcBetTotals\n      pointsBetTotals\n      originalTruthSocialPostId\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query GetPools(\n    $filter: Pool_filter!\n    $orderBy: Pool_orderBy!\n    $orderDirection: OrderDirection!\n    $first: Int\n  ) {\n    pools(\n      where: $filter\n      orderBy: $orderBy\n      orderDirection: $orderDirection\n      first: $first\n    ) {\n        id\n        poolId\n        question\n        options\n        status\n        chainId\n        chainName\n        createdAt\n        createdBlockNumber\n        createdBlockTimestamp\n        createdTransactionHash\n        lastUpdatedBlockNumber\n        lastUpdatedBlockTimestamp\n        lastUpdatedTransactionHash\n        gradedBlockNumber\n        gradedBlockTimestamp\n        gradedTransactionHash\n        betsCloseAt\n        usdcBetTotals\n        pointsBetTotals\n        usdcVolume\n        pointsVolume\n        originalTruthSocialPostId\n    }\n  }\n'
): (typeof documents)['\n  query GetPools(\n    $filter: Pool_filter!\n    $orderBy: Pool_orderBy!\n    $orderDirection: OrderDirection!\n    $first: Int\n  ) {\n    pools(\n      where: $filter\n      orderBy: $orderBy\n      orderDirection: $orderDirection\n      first: $first\n    ) {\n        id\n        poolId\n        question\n        options\n        status\n        chainId\n        chainName\n        createdAt\n        createdBlockNumber\n        createdBlockTimestamp\n        createdTransactionHash\n        lastUpdatedBlockNumber\n        lastUpdatedBlockTimestamp\n        lastUpdatedTransactionHash\n        gradedBlockNumber\n        gradedBlockTimestamp\n        gradedTransactionHash\n        betsCloseAt\n        usdcBetTotals\n        pointsBetTotals\n        usdcVolume\n        pointsVolume\n        originalTruthSocialPostId\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  subscription GetPoolsSubscription(\n    $filter: Pool_filter!\n  ) {\n    pools(\n      where: $filter\n    ) {\n        id\n        poolId\n        question\n        options\n        status\n        chainId\n        chainName\n        createdAt\n        createdBlockNumber\n        createdBlockTimestamp\n        createdTransactionHash\n        lastUpdatedBlockNumber\n        lastUpdatedBlockTimestamp\n        lastUpdatedTransactionHash\n        gradedBlockNumber\n        gradedBlockTimestamp\n        gradedTransactionHash\n    }\n  }\n'
): (typeof documents)['\n  subscription GetPoolsSubscription(\n    $filter: Pool_filter!\n  ) {\n    pools(\n      where: $filter\n    ) {\n        id\n        poolId\n        question\n        options\n        status\n        chainId\n        chainName\n        createdAt\n        createdBlockNumber\n        createdBlockTimestamp\n        createdTransactionHash\n        lastUpdatedBlockNumber\n        lastUpdatedBlockTimestamp\n        lastUpdatedTransactionHash\n        gradedBlockNumber\n        gradedBlockTimestamp\n        gradedTransactionHash\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query GetBetPlaced(\n    $first: Int = 10\n    $filter: BetPlaced_filter!\n    $orderBy: BetPlaced_orderBy!\n    $orderDirection: OrderDirection!\n  ) {\n    betPlaceds(\n      first: $first\n      where: $filter\n      orderBy: $orderBy\n      orderDirection: $orderDirection\n    ) {\n      id\n      betId\n      optionIndex\n      amount\n      poolId\n      blockNumber\n      blockTimestamp\n      transactionHash\n    }\n  }\n'
): (typeof documents)['\n  query GetBetPlaced(\n    $first: Int = 10\n    $filter: BetPlaced_filter!\n    $orderBy: BetPlaced_orderBy!\n    $orderDirection: OrderDirection!\n  ) {\n    betPlaceds(\n      first: $first\n      where: $filter\n      orderBy: $orderBy\n      orderDirection: $orderDirection\n    ) {\n      id\n      betId\n      optionIndex\n      amount\n      poolId\n      blockNumber\n      blockTimestamp\n      transactionHash\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query GetBets(\n    $first: Int = 10\n    $filter: Bet_filter!\n    $orderBy: Bet_orderBy!\n    $orderDirection: OrderDirection!\n  ) {\n    bets(\n      first: $first\n      where: $filter\n      orderBy: $orderBy\n      orderDirection: $orderDirection\n    ) {\n      id\n      betId\n      option\n      amount\n      poolId\n      blockNumber\n      blockTimestamp\n      transactionHash\n      pool {\n        id\n        poolId\n        question\n        options\n        status\n        chainId\n        chainName\n        createdAt\n      }\n    }\n  }\n'
): (typeof documents)['\n  query GetBets(\n    $first: Int = 10\n    $filter: Bet_filter!\n    $orderBy: Bet_orderBy!\n    $orderDirection: OrderDirection!\n  ) {\n    bets(\n      first: $first\n      where: $filter\n      orderBy: $orderBy\n      orderDirection: $orderDirection\n    ) {\n      id\n      betId\n      option\n      amount\n      poolId\n      blockNumber\n      blockTimestamp\n      transactionHash\n      pool {\n        id\n        poolId\n        question\n        options\n        status\n        chainId\n        chainName\n        createdAt\n      }\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  subscription GetBetsSubscription(\n    $filter: Bet_filter!\n  ) {\n    bets(\n      where: $filter\n    ) {\n      id\n      betId\n      option\n      amount\n      poolId\n      blockNumber\n      blockTimestamp\n      transactionHash\n      pool {\n        id\n        poolId\n        question\n        options\n        status\n        chainId\n        chainName\n        createdAt\n      }\n    }\n  }\n'
): (typeof documents)['\n  subscription GetBetsSubscription(\n    $filter: Bet_filter!\n  ) {\n    bets(\n      where: $filter\n    ) {\n      id\n      betId\n      option\n      amount\n      poolId\n      blockNumber\n      blockTimestamp\n      transactionHash\n      pool {\n        id\n        poolId\n        question\n        options\n        status\n        chainId\n        chainName\n        createdAt\n      }\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query GetPool($poolId: ID!) {\n    pool(id: $poolId) {\n      id\n      poolId\n      question\n      options\n      status\n      chainId\n      chainName\n      createdAt\n      createdBlockNumber\n      createdBlockTimestamp\n      createdTransactionHash\n      gradedBlockNumber\n      gradedBlockTimestamp\n      gradedTransactionHash\n      betsCloseAt\n      usdcBetTotals\n      pointsBetTotals\n      usdcVolume\n      pointsVolume\n      winningOption\n    }\n  }\n'
): (typeof documents)['\n  query GetPool($poolId: ID!) {\n    pool(id: $poolId) {\n      id\n      poolId\n      question\n      options\n      status\n      chainId\n      chainName\n      createdAt\n      createdBlockNumber\n      createdBlockTimestamp\n      createdTransactionHash\n      gradedBlockNumber\n      gradedBlockTimestamp\n      gradedTransactionHash\n      betsCloseAt\n      usdcBetTotals\n      pointsBetTotals\n      usdcVolume\n      pointsVolume\n      winningOption\n    }\n  }\n'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  subscription GetPoolSubscription($poolId: ID!) {\n    pool(id: $poolId) {\n      id\n      poolId\n      question\n      options\n      status\n      chainId\n      chainName\n      createdAt\n      createdBlockNumber\n      createdBlockTimestamp\n      createdTransactionHash\n      gradedBlockNumber\n      gradedBlockTimestamp\n      gradedTransactionHash\n    }\n  }\n'
): (typeof documents)['\n  subscription GetPoolSubscription($poolId: ID!) {\n    pool(id: $poolId) {\n      id\n      poolId\n      question\n      options\n      status\n      chainId\n      chainName\n      createdAt\n      createdBlockNumber\n      createdBlockTimestamp\n      createdTransactionHash\n      gradedBlockNumber\n      gradedBlockTimestamp\n      gradedTransactionHash\n    }\n  }\n'];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never;
