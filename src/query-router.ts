import { Query, QueryRouterClient } from "./client";

type ClientSourceName = string;

export class QueryRouter {
  private clientsMap: Record<ClientSourceName, QueryRouterClient> = {};
  constructor(private defaultClient: QueryRouterClient) {}

  addClient(client: QueryRouterClient, sourceName: ClientSourceName) {
    if (this.clientsMap[sourceName]) {
      throw new Error(`Client with source name ${sourceName} already exists`);
    }
    this.clientsMap[sourceName] = client;
  }

  async executeQueries(queries: Query[], datasource?: string): Promise<any[]> {
    if (!datasource) {
      const sources = this.getSources(queries);
      if (sources.length > 1) {
        throw new Error(
          `Queries from multiple sources are not supported: ${sources.join(
            ", "
          )}`
        );
      }
      if (sources.length === 1) {
        datasource = sources[0];
      }
    }

    const client = datasource
      ? this.clientsMap[datasource]
      : this.defaultClient;

    if (!client) {
      throw new Error(`Client with source name ${datasource} not found`);
    }

    return client.executeQueries(queries);
  }

  private getSources(queries: Query[]): ClientSourceName[] {
    const sources = new Set<string>();

    for (const query of queries) {
      for (const table of query.getTableNames()) {
        const parts = table.split("@");
        if (parts.length > 1) {
          sources.add(parts[0]);
        }
      }
    }

    return Array.from(sources);
  }
}
