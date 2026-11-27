import { Pool, types } from "pg";
import { getDatabase } from "./sqlite-store";

let pool: Pool | undefined;
export function postgresPool() {
  if (!process.env.DATABASE_URL)
    throw new Error("Set DATABASE_URL for PostgreSQL.");
  return (pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 8,
    types: {
      getTypeParser: (oid, format) =>
        oid === 20 && format !== "binary"
          ? Number
          : types.getTypeParser(oid, format),
    },
  }));
}

/** Only application-owned SQL enters this helper. Values always go through driver bindings. */
export function relationalStatement(sql: string) {
  if (process.env.VULNMENTOR_DATABASE_PROVIDER !== "postgres")
    return getDatabase().prepare(sql);
  let parameter = 0;
  const query = sql.replace(/\?/g, () => "$" + ++parameter);
  return {
    async get(...values: unknown[]) {
      return (await postgresPool().query(query, values)).rows[0];
    },
    async all(...values: unknown[]) {
      return (await postgresPool().query(query, values)).rows;
    },
    async run(...values: unknown[]) {
      return {
        changes: (await postgresPool().query(query, values)).rowCount ?? 0,
      };
    },
  };
}
