import { Q, SelectQuery } from "@jakub.knejzlik/ts-query";
import * as mysql from "mysql2/promise";
import { URL } from "url";
import { QueryRouterClient, QueryRouterClientOpts } from "./client";

interface QueryRouterClientMySQLOpts extends Partial<QueryRouterClientOpts> {
  databaseUrl: string;
  databaseName: string;
  poolOptions?: mysql.PoolOptions;
}

export class QueryRouterClientMySQL extends QueryRouterClient<QueryRouterClientMySQLOpts> {
  constructor({ flavor, ...opts }: QueryRouterClientMySQLOpts) {
    super({ flavor: flavor ?? Q.flavors.mysql, ...opts });
  }

  async executeQueries(queries: SelectQuery[]): Promise<any[]> {
    const { databaseUrl, databaseName, poolOptions } = this.opts;
    const res = await executeQueries({
      databaseUrl,
      databaseName,
      sqls: queries.map((query) => query.toSQL(this.opts.flavor)),
      poolOptions,
    });
    return res.results;
  }
}

export interface ExecuteQueriesOpts {
  databaseUrl: string;
  databaseName: string;
  sqls: string[];
  poolOptions?: mysql.PoolOptions;
}

export interface ExecuteQueryResult {
  results: any[];
}

// Caches connection pools by MySQL hostname
const poolCache: { [hostname: string]: mysql.Pool } = {};

function createPoolKey(databaseUrl: string): string {
  const { hostname } = new URL(databaseUrl);
  return hostname || "";
}

function getPool(
  poolKey: string,
  databaseUrl: string,
  poolOptions?: mysql.PoolOptions
): mysql.Pool {
  if (!poolCache[poolKey]) {
    poolCache[poolKey] = mysql.createPool({
      uri: databaseUrl,
      ...poolOptions,
      multipleStatements: true,
    });
  }
  return poolCache[poolKey];
}

export const executeQueries = async (
  opts: ExecuteQueriesOpts
): Promise<ExecuteQueryResult> => {
  const { poolOptions, databaseName, sqls } = opts;
  if (sqls.length === 0) return { results: [] };

  const databaseUrl = opts.databaseUrl
    .replace("{{MYSQL_USER}}", process.env.MYSQL_USER || "")
    .replace("{{MYSQL_PASSWORD}}", process.env.MYSQL_PASSWORD || "");
  const poolKey = createPoolKey(databaseUrl);
  const pool = getPool(poolKey, databaseUrl, poolOptions);
  let connection: mysql.PoolConnection | null = null;

  try {
    connection = await pool.getConnection();

    const sql = `USE \`${databaseName}\`;\n` + sqls.join(";\n");
    const [results] = await connection.query({ sql });

    return { results: (results as any[]).slice(1) };
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};
