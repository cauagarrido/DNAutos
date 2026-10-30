import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { dbGet, dbRun } from './database';
import { env } from '../config/env';

type UserRow = { id: string; name: string; email: string; password_hash: string; created_at: string };
const b64 = (value: string) => Buffer.from(value).toString('base64url');
function sign(payload: object, ttlSeconds: number): string {
  if (!env.jwtSecret) { const e = new Error('JWT_SECRET não está configurado.') as Error & { status: number }; e.status = 503; throw e; }
  const body = b64(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds }));
  const sig = createHmac('sha256', env.jwtSecret).update(body).digest('base64url');
  return `${body}.${sig}`;
}
export function verifyToken(token: string): any {
  const [body, signature] = token.split('.');
  if (!body || !signature || !env.jwtSecret) throw new Error('Token inválido.');
  const expected = createHmac('sha256', env.jwtSecret).update(body).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error('Token inválido.');
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (payload.exp <= Date.now() / 1000) throw new Error('Token expirado.');
  return payload;
}
function publicUser(row: UserRow) { return { id: row.id, name: row.name, email: row.email, createdAt: row.created_at }; }
function session(row: UserRow) { return { user: publicUser(row), token: sign({ sub: row.id, type: 'session' }, 60 * 60 * 24 * 30) }; }

export class AuthService {
  static async register(name: string, email: string, password: string) {
    if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(email ?? '') || (password?.length ?? 0) < 8) throw new Error('Informe nome e e-mail válidos; a senha deve ter pelo menos 8 caracteres.');
    const id = randomBytes(16).toString('hex'); const created = new Date().toISOString(); const salt = randomBytes(16).toString('hex');
    const hash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
    try { await dbRun('INSERT INTO users (id,name,email,password_hash,created_at) VALUES (?,?,?,?,?)', [id, name.trim(), email.trim().toLowerCase(), hash, created]); }
    catch (error: any) {
      if (error?.code === '23505' || (error?.code === 'ERR_SQLITE_ERROR' && /unique/i.test(error?.message ?? ''))) throw new Error('Este e-mail já está cadastrado. Faça login.');
      throw error;
    }
    return session({ id, name: name.trim(), email: email.trim().toLowerCase(), password_hash: hash, created_at: created });
  }
  static async login(email: string, password: string) {
    const row = await dbGet<UserRow>('SELECT * FROM users WHERE email=?', [email.trim().toLowerCase()]);
    if (!row) throw new Error('E-mail ou senha incorretos.');
    const [salt, digest] = row.password_hash.split(':'); const expected = Buffer.from(digest, 'hex'); const actual = scryptSync(password, salt, 64);
    if (!timingSafeEqual(expected, actual)) throw new Error('E-mail ou senha incorretos.');
    return session(row);
  }
}
