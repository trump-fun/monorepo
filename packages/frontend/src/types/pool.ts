import { GetPoolQuery, GetPoolsQuery } from './__generated__/graphql';
import {
  GetPoolQuery as GetPoolQueryBackend,
  GetPoolsQuery as GetPoolsQueryBackend,
} from './__generated__/graphql-request';

export interface TokenBalance {
  value: string | bigint;
  decimals: number;
  formatted?: string;
  symbol?: string;
}

//Frontend types
export type PoolsQueryResultTypeMulti = GetPoolsQuery['pools'];
export type PoolsQueryResultTypeSingle = GetPoolQuery['pool'] | GetPoolsQuery['pools'][0];

//Backend types
export type PoolsQueryResultTypeMultiBackend = GetPoolsQueryBackend['pools'];
export type PoolsQueryResultTypeSingleBackend =
  | GetPoolQueryBackend['pool']
  | GetPoolsQueryBackend['pools'][0];
