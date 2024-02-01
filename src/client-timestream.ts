import {
  Datum,
  QueryCommand,
  TimestreamQueryClient,
} from "@aws-sdk/client-timestream-query";
import { AWSTimestreamFlavor, SelectQuery } from "@jakub.knejzlik/ts-query";
import { QueryRouterClient, QueryRouterClientOpts } from "./client";

const timestreamQuery = new TimestreamQueryClient({ region: "eu-central-1" });

class CustomAWSTimestreamFlavor extends AWSTimestreamFlavor {
  constructor(private databaseName: string) {
    super();
  }
  escapeTable(table: string): string {
    return `"${this.databaseName}"."${table}"`;
  }
}

interface QueryRouterClientAWSTimestreamOpts
  extends Partial<QueryRouterClientOpts> {
  databaseName: string;
}

export class QueryRouterClientAWSTimestream extends QueryRouterClient<QueryRouterClientAWSTimestreamOpts> {
  constructor({ flavor, ...opts }: QueryRouterClientAWSTimestreamOpts) {
    super({
      flavor: flavor ?? new CustomAWSTimestreamFlavor(opts.databaseName),
      ...opts,
    });
  }

  async executeQueries(queries: SelectQuery[]): Promise<any[]> {
    return Promise.all(
      queries.map((query) => queryTimestream(query.toSQL(this.opts.flavor)))
    );
  }
}

function parseDatum(columnType: string | undefined, datum: Datum): any {
  if (!datum.ScalarValue) {
    return null;
  }

  switch (columnType) {
    case "VARCHAR":
      return datum.ScalarValue;
    case "BIGINT":
      return parseInt(datum.ScalarValue);
    case "DOUBLE":
      return parseFloat(datum.ScalarValue);
    case "BOOLEAN":
      return datum.ScalarValue === "true";
    case "TIMESTAMP":
      return new Date(datum.ScalarValue);
    default:
      return datum.ScalarValue;
  }
}

async function queryTimestream(queryString: string): Promise<any[]> {
  try {
    const command = new QueryCommand({ QueryString: queryString });
    const response = await timestreamQuery.send(command);

    if (!response.Rows || !response.ColumnInfo) {
      throw new Error("Invalid response format");
    }

    // Extract column names and types from ColumnInfo
    const columnInfo = response.ColumnInfo;

    // Map rows to objects with column names as keys and properly typed values
    return response.Rows.map((row) => {
      const rowObject: { [key: string]: any } = {};
      row.Data?.forEach((datum, index) => {
        const info = columnInfo[index];
        if (info.Name) {
          rowObject[info.Name] = parseDatum(info.Type?.ScalarType, datum);
        }
      });
      return rowObject;
    });
  } catch (error) {
    console.error("Error querying Timestream:", error);
    throw error;
  }
}
