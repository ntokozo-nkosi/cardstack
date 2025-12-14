import { Pool, QueryResult } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

/**
 * Execute a parameterized SQL query
 */
export async function query(
  text: string,
  values?: unknown[]
): Promise<QueryResult> {
  return pool.query(text, values);
}

const db = { query };
export default db;

