import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env';

fs.mkdirSync(path.dirname(env.databasePath), { recursive: true });
export const db = new DatabaseSync(env.databasePath);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), plate TEXT NOT NULL, amount INTEGER NOT NULL, status TEXT NOT NULL, mp_preference_id TEXT, mp_payment_id TEXT, report_token TEXT, created_at TEXT NOT NULL, expires_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS reports (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), plate TEXT NOT NULL, report_json TEXT NOT NULL, consulted_at TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS reports_user_date ON reports(user_id, consulted_at DESC);
`);
