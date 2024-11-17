import {
  ISQLFlavor,
  ISequelizable,
  ISerializable,
} from "@jakub.knejzlik/ts-query";
import { IMetadata } from "@jakub.knejzlik/ts-query/dist/interfaces";

export interface Query extends ISequelizable, ISerializable, IMetadata {}

export interface IQueryRouterClient<Result = any> {
  executeQueries(queries: Query[]): Promise<Result>;
  executeRawQueries(queries: string[]): Promise<Result>;
}

export interface QueryRouterClientOpts {
  flavor: ISQLFlavor;
}

export class QueryRouterClient<
  T extends Partial<QueryRouterClientOpts> = QueryRouterClientOpts
> implements IQueryRouterClient
{
  constructor(protected opts: T & QueryRouterClientOpts) {}

  executeQueries(_: Query[]): Promise<any> {
    throw new Error("Method not implemented.");
  }
  executeRawQueries(_: string[]): Promise<any> {
    throw new Error("Method not implemented.");
  }
}
