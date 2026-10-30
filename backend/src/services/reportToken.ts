import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env';
const encode = (x: object) => Buffer.from(JSON.stringify(x)).toString('base64url');
export function signReportToken(payload: object, seconds: number) {
  if (!env.jwtSecret) { const e = new Error('JWT_SECRET não está configurado.') as Error & { status: number }; e.status = 503; throw e; }
  const body = encode({ ...payload, kind: 'report', exp: Math.floor(Date.now() / 1000) + seconds });
  return `${body}.${createHmac('sha256', env.jwtSecret).update(body).digest('base64url')}`;
}
export function verifyReportToken(token: string) {
  const [body, signature] = token.split('.');
  if (!body || !signature || !env.jwtSecret) throw new Error('Token de relatório inválido.');
  const expected = createHmac('sha256', env.jwtSecret).update(body).digest(); const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error('Token de relatório inválido.');
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (payload.kind !== 'report' || payload.exp <= Date.now() / 1000) throw new Error('Token de relatório expirado.');
  return payload as { userId: string; paymentId: string; plate: string; kind: string; exp: number };
}
