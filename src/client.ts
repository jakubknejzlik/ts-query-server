import {
  ISQLFlavor,
  ISequelizable,
  ISerializable,
} from "@jakub.knejzlik/ts-query";
import {
  IMetadata,
  ISequelizableOptions,
} from "@jakub.knejzlik/ts-query/dist/interfaces";

export interface Query extends ISequelizable, ISerializable, IMetadata {}

export interface IQueryRouterClient<Result = any> {
  executeQueries(queries: Query[]): Promise<Result>;
  executeRawQueries(queries: string[]): Promise<Result>;
}

export interface QueryRouterClientOpts {
  flavor: ISQLFlavor;
  sequelizeOptions?: ISequelizableOptions;
}

export class QueryRouterClient<
  T extends Partial<QueryRouterClientOpts> = QueryRouterClientOpts
> implements IQueryRouterClient
{
  constructor(protected opts: T & QueryRouterClientOpts) {}

  executeQueries(queries: Query[]): Promise<any> {
    return this.executeRawQueries(
      queries.map((query) =>
        query.toSQL(this.opts.flavor, this.opts.sequelizeOptions)
      )
    );
  }
  executeRawQueries(_: string[]): Promise<any> {
    throw new Error("Method not implemented.");
  }
}
