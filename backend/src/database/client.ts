import { Pool, PoolClient, QueryResultRow } from "pg";
import { env } from "../config/env";
import { HttpError } from "../shared/security";
let pool: Pool | undefined;
export function getPool() {
  if (!env.databaseUrl)
    throw new HttpError(503, "Serviço ainda não configurado.");
  if (!pool) {
    const url = new URL(env.databaseUrl);
    for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"])
      url.searchParams.delete(key);
    pool = new Pool({
      connectionString: url.toString(),
      max: 5,
      connectionTimeoutMillis: 8000,
      idleTimeoutMillis: 10_000,
      statement_timeout: 15_000,
      ssl:
        env.nodeEnv === "production" || env.databaseCa
          ? { rejectUnauthorized: true, ca: env.databaseCa }
          : undefined,
    });
    pool.on("error", () => console.error("database_connection_error"));
  }
  return pool;
}
export type Sql = Pick<PoolClient, "query">;
export const database = {
  async query<T extends QueryResultRow = any>(
    sql: string,
    values: unknown[] = [],
  ) {
    return (await getPool().query<T>(sql, values)).rows;
  },
  async transaction<T>(work: (client: Sql) => Promise<T>): Promise<T> {
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};
