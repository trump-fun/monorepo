/* eslint-disable */
// Re-export the gql function from Apollo Client to ensure proper typing
import { gql as apolloGql } from '@apollo/client/core';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Re-export the Apollo gql function to ensure proper DocumentNode typing.
 * This function parses GraphQL queries into a document that can be used by GraphQL clients.
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 */
export const gql = apolloGql;

/**
 * Helper type to extract the result type from a DocumentNode
 */
export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never;

/**
 * Helper type to extract the variables type from a DocumentNode
 */
export type DocumentVarType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<any, infer TVariables> ? TVariables : never;
