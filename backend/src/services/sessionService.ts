import { randomBytes } from "node:crypto";
import { Request, Response } from "express";
import { parse, serialize } from "cookie";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { database } from "./database";
import { authClient } from "./supabase";
import { env, IDLE_MS } from "../config/env";
import {
  digest,
  HttpError,
  identityKey,
  seal,
  unseal,
} from "../utils/security";

const secure = () => env.nodeEnv === "production";
export const sessionCookie = () =>
  secure() ? "__Host-benz_session" : "benz_session";
const options = () => ({
  httpOnly: true,
  secure: secure(),
  sameSite: "lax" as const,
  path: "/",
  maxAge: IDLE_MS / 1000,
});
export function cookieValue(req: Request, name = sessionCookie()) {
  return parse(req.headers.cookie || "")[name];
}
export function setCookie(
  res: Response,
  name: string,
  value: string,
  maxAge = IDLE_MS / 1000,
) {
  res.append("Set-Cookie", serialize(name, value, { ...options(), maxAge }));
}
export function clearCookie(res: Response, name = sessionCookie()) {
  setCookie(res, name, "", 0);
}
export type SessionContext = {
  hash: string;
  user: User;
  client: SupabaseClient;
  purpose: "login" | "recovery";
  mfaRequired: boolean;
  needsEnrollment: boolean;
  factorId?: string;
};
type Tokens = { access_token: string; refresh_token: string };
export function tokens(session: Session): Tokens {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  };
}
export function isIdle(lastActivity: Date | string, now = Date.now()) {
  return now - new Date(lastActivity).getTime() >= IDLE_MS;
}
export async function createSession(
  res: Response,
  session: Session,
  purpose: "login" | "recovery" = "login",
  req?: Request,
) {
  if (!session.user.email_confirmed_at || !session.user.email)
    throw new HttpError(403, "Confirme seu e-mail para continuar.");
  const raw = randomBytes(32).toString("base64url");
  await database.transaction(async (db) => {
    if (purpose === "login") {
      const key = identityKey(session.user.email!.toLowerCase());
      await db.query(
        "INSERT INTO benz.login_guards (key) VALUES ($1) ON CONFLICT DO NOTHING",
        [key],
      );
      const guard = (
        await db.query(
          "SELECT locked FROM benz.login_guards WHERE key=$1 FOR UPDATE",
          [key],
        )
      ).rows[0];
      if (guard.locked)
        throw new HttpError(
          423,
          "Acesso bloqueado. Recupere sua conta por e-mail.",
          "ACCOUNT_LOCKED",
        );
    }
    await db.query(
      "INSERT INTO benz.profiles (id,email) VALUES ($1,$2) ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email",
      [session.user.id, session.user.email],
    );
    // Session rotation prevents fixation and revokes the previous browser session.
    const previous = req && cookieValue(req);
    if (previous)
      await db.query("DELETE FROM benz.sessions WHERE token_hash=$1", [
        digest(previous),
      ]);
    await db.query(
      "INSERT INTO benz.sessions (token_hash,user_id,encrypted_tokens,purpose) VALUES ($1,$2,$3,$4)",
      [digest(raw), session.user.id, seal(tokens(session)), purpose],
    );
  });
  setCookie(res, sessionCookie(), raw);
}
export async function describe(client: SupabaseClient, user: User) {
  const [level, factors] = await Promise.all([
    client.auth.mfa.getAuthenticatorAssuranceLevel(),
    client.auth.mfa.listFactors(),
  ]);
  if (level.error || factors.error)
    throw new HttpError(
      503,
      "Não foi possível verificar a segurança da sessão.",
    );
  const phone = factors.data.phone.find((f) => f.status === "verified");
  const verified = factors.data.all.some((f) => f.status === "verified");
  const needsEnrollment = env.requirePhoneMfa && !phone;
  const mfaRequired =
    needsEnrollment ||
    ((env.requirePhoneMfa || verified) && level.data.currentLevel !== "aal2");
  return {
    mfaRequired,
    needsEnrollment,
    factorId:
      needsEnrollment && level.data.currentLevel === "aal2"
        ? undefined
        : (phone?.id ??
          factors.data.totp.find((f) => f.status === "verified")?.id),
  };
}
export function publicSession(ctx: SessionContext) {
  return {
    user: {
      id: ctx.user.id,
      email: ctx.user.email!,
      name: ctx.user.email!.split("@")[0],
      createdAt: ctx.user.created_at,
    },
    mfaRequired: ctx.mfaRequired,
    needsEnrollment: ctx.needsEnrollment,
    factorId: ctx.factorId,
    recovery: ctx.purpose === "recovery",
  };
}
export async function restoreSession(req: Request): Promise<SessionContext> {
  const raw = cookieValue(req);
  if (!raw || !/^[A-Za-z0-9_-]{43}$/.test(raw))
    throw new HttpError(401, "Entre na sua conta para continuar.");
  const hash = digest(raw);
  // Serialize refresh-token rotation across processes, tabs and serverless instances.
  const restored = await database.transaction(async (db) => {
    const row = (
      await db.query(
        "SELECT * FROM benz.sessions WHERE token_hash=$1 FOR UPDATE",
        [hash],
      )
    ).rows[0];
    if (!row) return null;
    if (
      isIdle(row.last_activity) ||
      Date.now() - new Date(row.created_at).getTime() >= 24 * 60 * 60_000
    ) {
      await db.query("DELETE FROM benz.sessions WHERE token_hash=$1", [hash]);
      return null;
    }
    const client = authClient(),
      saved = unseal<Tokens>(row.encrypted_tokens);
    const session = await client.auth.setSession(saved);
    if (
      session.error &&
      ((session.error.status ?? 0) >= 500 ||
        session.error.name === "AuthRetryableFetchError")
    )
      throw new HttpError(
        503,
        "Autenticação temporariamente indisponível. Tente novamente.",
      );
    if (session.error || !session.data.session) {
      await db.query("DELETE FROM benz.sessions WHERE token_hash=$1", [hash]);
      return null;
    }
    const result = await client.auth.getUser();
    if (
      result.error &&
      ((result.error.status ?? 0) >= 500 ||
        result.error.name === "AuthRetryableFetchError")
    )
      throw new HttpError(
        503,
        "Autenticação temporariamente indisponível. Tente novamente.",
      );
    if (
      result.error ||
      result.data.user?.id !== row.user_id ||
      !result.data.user.email_confirmed_at
    ) {
      await db.query("DELETE FROM benz.sessions WHERE token_hash=$1", [hash]);
      return null;
    }
    await db.query(
      "UPDATE benz.sessions SET encrypted_tokens=$1 WHERE token_hash=$2",
      [seal(tokens(session.data.session)), hash],
    );
    return { hash, client, user: result.data.user, purpose: row.purpose };
  });
  if (!restored)
    throw new HttpError(401, "Sua sessão expirou. Entre novamente.");
  return { ...restored, ...(await describe(restored.client, restored.user)) };
}
export async function saveClientTokens(ctx: SessionContext) {
  const result = await ctx.client.auth.getSession();
  if (!result.data.session) throw new HttpError(401, "Entre novamente.");
  await database.query(
    "UPDATE benz.sessions SET encrypted_tokens=$1 WHERE token_hash=$2",
    [seal(tokens(result.data.session)), ctx.hash],
  );
}
