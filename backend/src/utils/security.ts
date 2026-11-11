import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { env } from "../config/env";
import { z } from "zod";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}
export const emailSchema = z.string().trim().toLowerCase().email().max(254);
// bcrypt limits input to 72 bytes. Never silently truncate Unicode passwords.
export const passwordSchema = z
  .string()
  .min(12)
  .max(72)
  .refine((v) => Buffer.byteLength(v, "utf8") <= 72);
export const plateSchema = z
  .string()
  .trim()
  .toUpperCase()
  .transform((v) => v.replace(/[-\s]/g, ""))
  .pipe(z.string().regex(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/));
export const uuidSchema = z.string().uuid();
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export function identityKey(value: string) {
  if (env.authRateSecret.length < 32)
    throw new HttpError(503, "Serviço ainda não configurado.");
  return createHmac("sha256", env.authRateSecret).update(value).digest("hex");
}
export function seal(value: unknown): string {
  const key = Buffer.from(env.sessionKey, "base64");
  if (key.length !== 32)
    throw new HttpError(503, "Serviço ainda não configurado.");
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}
export function unseal<T>(value: string): T {
  const bytes = Buffer.from(value, "base64url");
  const cipher = createDecipheriv(
    "aes-256-gcm",
    Buffer.from(env.sessionKey, "base64"),
    bytes.subarray(0, 12),
  );
  cipher.setAuthTag(bytes.subarray(12, 28));
  return JSON.parse(
    Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString(
      "utf8",
    ),
  );
}
export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a),
    right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
