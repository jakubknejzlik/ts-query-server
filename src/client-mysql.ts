import { Q, SelectQuery } from "@jakub.knejzlik/ts-query";
import * as mysql from "mysql2/promise";
import { URL } from "url";
import { QueryRouterClient, QueryRouterClientOpts } from "./client";

interface QueryRouterClientMySQLOpts extends Partial<QueryRouterClientOpts> {
  databaseUrl: string;
  databaseName: string;
}

export class QueryRouterClientMySQL extends QueryRouterClient<QueryRouterClientMySQLOpts> {
  constructor({ flavor, ...opts }: QueryRouterClientMySQLOpts) {
    super({ flavor: flavor ?? Q.flavors.mysql, ...opts });
  }

  async executeQueries(queries: SelectQuery[]): Promise<any[]> {
    const res = await executeQueries({
      databaseUrl: this.opts.databaseUrl,
      databaseName: this.opts.databaseName,
      sqls: queries.map((query) => query.toSQL(Q.flavors.mysql)),
    });
    return res.results;
  }
}

export interface ExecuteQueriesOpts {
  databaseUrl: string;
  databaseName: string;
  sqls: string[];
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

function getPool(poolKey: string, databaseUrl: string): mysql.Pool {
  if (!poolCache[poolKey]) {
    poolCache[poolKey] = mysql.createPool({
      uri: databaseUrl,
      multipleStatements: true,
    });
  }
  return poolCache[poolKey];
}

export const executeQueries = async (
  event: ExecuteQueriesOpts
): Promise<ExecuteQueryResult> => {
  if (event.sqls.length === 0) return { results: [] };

  const databaseUrl = event.databaseUrl
    .replace("{{MYSQL_USER}}", process.env.MYSQL_USER || "")
    .replace("{{MYSQL_PASSWORD}}", process.env.MYSQL_PASSWORD || "");
  const poolKey = createPoolKey(databaseUrl);
  const pool = getPool(poolKey, databaseUrl);
  let connection: mysql.PoolConnection | null = null;

  try {
    connection = await pool.getConnection();

    const sql = `USE \`${event.databaseName}\`;\n` + event.sqls.join(";\n");
    const [results] = await connection.query({ sql });

    return { results: (results as any[]).slice(1) };
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};
