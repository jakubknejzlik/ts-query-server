import { ISQLFlavor, Q, SelectQuery } from "@jakub.knejzlik/ts-query";
import {
  DeleteMutation,
  InsertMutation,
  UpdateMutation,
} from "@jakub.knejzlik/ts-query/dist/Mutation";

export type Query =
  | SelectQuery
  | InsertMutation
  | UpdateMutation
  | DeleteMutation;

export interface IQueryRouterClient<Result = any> {
  executeQueries(queries: Query[]): Promise<Result>;
}

export interface QueryRouterClientOpts {
  flavor: ISQLFlavor;
}

export class QueryRouterClient<O = QueryRouterClientOpts>
  implements IQueryRouterClient
{
  constructor(protected opts: O) {}
  executeQueries(queries: Query[]): Promise<any> {
    throw new Error("Method not implemented.");
  }
}
