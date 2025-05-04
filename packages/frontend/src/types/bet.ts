import { GetBetsQuery } from './__generated__/graphql';
import { GetBetsQuery as GetBetsQueryBackend } from './__generated__/graphql-request';

//Frontend types
export type BetsQueryResultTypeMulti = GetBetsQuery['bets'];
export type BetsQueryResultTypeSingle = GetBetsQuery['bets'][0];

//Backend types
export type BetsQueryResultTypeMultiBackend = GetBetsQueryBackend['bets'];
export type BetsQueryResultTypeSingleBackend = GetBetsQueryBackend['bets'][0];
