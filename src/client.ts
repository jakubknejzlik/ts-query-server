import { ISQLFlavor, SelectQuery } from "@jakub.knejzlik/ts-query";
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

export class QueryRouterClient<T extends Partial<QueryRouterClientOpts>>
  implements IQueryRouterClient
{
  constructor(protected opts: T & QueryRouterClientOpts) {}

  executeQueries(queries: Query[]): Promise<any> {
    throw new Error("Method not implemented.");
  }
}
