import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';
import { env } from '../config/env';

const usePostgres = Boolean(env.databaseUrl);
const isVercelPreview = process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'preview';
if (env.nodeEnv === 'production' && !usePostgres && !isVercelPreview) {
  throw new Error('DATABASE_URL é obrigatório em produção para salvar os dados em banco persistente.');
}
const sqlite = usePostgres ? null : (() => {
  const databasePath = isVercelPreview ? '/tmp/dnautos-preview.sqlite' : env.databasePath;
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  return new DatabaseSync(databasePath);
})();
const postgres = usePostgres
  ? new Pool({ connectionString: env.databaseUrl, max: 5 })
  : null;

function pgSql(sql: string) {
  let parameterIndex = 0;
  return sql.replace(/\?/g, () => `$${++parameterIndex}`);
}

const schema = `
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), plate TEXT NOT NULL, amount INTEGER NOT NULL, status TEXT NOT NULL, mp_preference_id TEXT, mp_payment_id TEXT, report_token TEXT, created_at TEXT NOT NULL, expires_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS reports (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), plate TEXT NOT NULL, report_json TEXT NOT NULL, consulted_at TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS reports_user_date ON reports(user_id, consulted_at DESC);
`;

const ready = (async () => {
  if (sqlite) {
    sqlite.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    sqlite.exec(schema);
  } else if (postgres) {
    await postgres.query(schema);
  }
})();

export async function dbGet<T>(sql: string, params: any[] = []): Promise<T | undefined> {
  await ready;
  if (sqlite) return sqlite.prepare(sql).get(...params) as T | undefined;
  const result = await postgres!.query(pgSql(sql), params);
  return result.rows[0] as T | undefined;
}

export async function dbAll<T>(sql: string, params: any[] = []): Promise<T[]> {
  await ready;
  if (sqlite) return sqlite.prepare(sql).all(...params) as T[];
  const result = await postgres!.query(pgSql(sql), params);
  return result.rows as T[];
}

export async function dbRun(sql: string, params: any[] = []): Promise<void> {
  await ready;
  if (sqlite) {
    sqlite.prepare(sql).run(...params);
    return;
  }
  await postgres!.query(pgSql(sql), params);
}

export const databaseMode = usePostgres ? 'postgres' : 'sqlite';
