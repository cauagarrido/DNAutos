import { Router, Request, Response, NextFunction } from "express";
import { randomBytes } from "node:crypto";
import { AuthService } from "./auth.service";
import { authClient } from "../../integrations/supabase/auth.client";
import { database } from "../../database/client";
import { env } from "../../config/env";
import { requireSession, requireAuth } from "../../http/middleware/requireAuth";
import { rateLimit } from "../../http/middleware/security";
import {
  clearCookie,
  cookieValue,
  createSession,
  publicSession,
  sessionCookie,
  setCookie,
} from "./session.service";
import { HttpError, identityKey, seal, unseal } from "../../shared/security";

const router = Router();
const action =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res))
      .then((value) => {
        if (!res.headersSent) res.json(value);
      })
      .catch(next);
  };
router.post(
  "/register",
  rateLimit("register", 5, 3600),
  action((req) => AuthService.register(req.body)),
);
router.post(
  "/login",
  rateLimit("login", 30, 900),
  action((req, res) => AuthService.login(req.body, req, res)),
);
router.post(
  "/recover",
  rateLimit("recover", 5, 3600),
  action((req) => AuthService.recover(req.body)),
);
router.post(
  "/resend",
  rateLimit("resend", 5, 3600),
  action((req) => AuthService.resend(req.body)),
);
router.post(
  "/confirm",
  rateLimit("confirm", 20, 900),
  action((req, res) => AuthService.confirm(req.body, req, res)),
);
router.get(
  "/session",
  requireSession,
  action(async (req) => publicSession(req.auth!)),
);
router.post(
  "/activity",
  requireSession,
  action(async (req, res) => {
    await database.query(
      "UPDATE benz.sessions SET last_activity=now() WHERE token_hash=$1",
      [req.auth!.hash],
    );
    const raw = cookieValue(req)!;
    setCookie(res, sessionCookie(), raw);
    return { ok: true };
  }),
);
router.post(
  "/password",
  requireSession,
  rateLimit("password", 5, 900),
  action(async (req, res) => {
    const result = await AuthService.resetPassword(req.body, req.auth!, res);
    clearCookie(res);
    return result;
  }),
);
router.post(
  "/mfa/challenge",
  requireSession,
  rateLimit("sms", 5, 900),
  action((req) => AuthService.challenge(req.body, req.auth!)),
);
router.post(
  "/mfa/verify",
  requireSession,
  rateLimit("otp", 10, 900),
  action((req) => AuthService.verifyMfa(req.body, req.auth!)),
);
router.post(
  "/logout",
  requireSession,
  action(async (req, res) => {
    await database.query("DELETE FROM benz.sessions WHERE token_hash=$1", [
      req.auth!.hash,
    ]);
    await req.auth!.client.auth.signOut({ scope: "local" });
    clearCookie(res);
    return { ok: true };
  }),
);
router.get(
  "/reports",
  requireAuth,
  action(async (req) => {
    const rows = await database.query(
      "SELECT r.report_json FROM benz.reports r JOIN benz.orders o ON o.id=r.order_id WHERE r.user_id=$1 AND o.status='approved' ORDER BY r.consulted_at DESC LIMIT 100",
      [req.userId],
    );
    return rows.map((row) => row.report_json);
  }),
);

const oauthCookie = () =>
  env.nodeEnv === "production" ? "__Host-benz_oauth" : "benz_oauth";
router.post(
  "/google",
  rateLimit("google", 10, 900),
  action(async (_req, res) => {
    const storage: Record<string, string> = {},
      flow = randomBytes(24).toString("hex");
    const client = authClient(storage, true);
    const result = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${env.publicApiUrl}/api/auth/callback?flow=${flow}`,
        skipBrowserRedirect: true,
      },
    });
    if (result.error || !result.data.url)
      throw new HttpError(503, "Login com Google indisponível.");
    // Only the PKCE verifier is serialized, before any authenticated session exists.
    setCookie(
      res,
      oauthCookie(),
      seal({ storage, flow, expires: Date.now() + 600_000 }),
      600,
    );
    return { url: result.data.url };
  }),
);
router.get(
  "/callback",
  action(async (req, res) => {
    try {
      const raw = cookieValue(req, oauthCookie());
      if (!raw || typeof req.query.code !== "string")
        throw new Error("invalid_callback");
      const flow = unseal<{
        storage: Record<string, string>;
        flow: string;
        expires: number;
      }>(raw);
      if (flow.expires < Date.now() || flow.flow !== req.query.flow)
        throw new Error("invalid_flow");
      const client = authClient(flow.storage, true),
        result = await client.auth.exchangeCodeForSession(req.query.code);
      if (
        result.error ||
        !result.data.session ||
        !result.data.user?.email_confirmed_at
      )
        throw new Error("invalid_identity");
      const key = identityKey(result.data.user.email!.toLowerCase());
      const locked = (
        await database.query(
          "SELECT locked FROM benz.login_guards WHERE key=$1",
          [key],
        )
      )[0];
      if (locked?.locked) {
        clearCookie(res, oauthCookie());
        res.redirect(`${env.publicAppUrl}/?auth=locked`);
        return;
      }
      await createSession(res, result.data.session, "login", req);
      clearCookie(res, oauthCookie());
      res.redirect(`${env.publicAppUrl}/?auth=google`);
    } catch {
      clearCookie(res, oauthCookie());
      res.redirect(`${env.publicAppUrl}/?auth=error`);
    }
  }),
);
export default router;
