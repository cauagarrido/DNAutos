import { Request, Response } from "express";
import { z } from "zod";
import { database } from "./database";
import { authClient } from "./supabase";
import { env } from "../config/env";
import {
  emailSchema,
  passwordSchema,
  HttpError,
  identityKey,
} from "../utils/security";
import {
  createSession,
  saveClientTokens,
  SessionContext,
} from "./sessionService";

export const credentials = z
  .object({ email: emailSchema, password: z.string().min(1).max(256) })
  .strict();
export class AuthService {
  static async register(body: unknown) {
    const { email, password } = z
      .object({ email: emailSchema, password: passwordSchema })
      .strict()
      .parse(body);
    const { error } = await authClient().auth.signUp({
      email,
      password,
      options: { emailRedirectTo: env.publicAppUrl },
    });
    if (
      error &&
      !["user_already_exists", "email_exists"].includes(error.code || "")
    )
      throw new HttpError(
        error.status === 429 ? 429 : 400,
        "Não foi possível criar a conta. Verifique os dados ou tente recuperar o acesso.",
      );
    return {
      message:
        "Se o endereço puder ser cadastrado, enviaremos um e-mail de confirmação. Confira sua caixa de entrada.",
    };
  }
  static async login(body: unknown, req: Request, res: Response) {
    const { email, password } = credentials.parse(body),
      key = identityKey(email);
    const result = await database.transaction(async (db) => {
      await db.query(
        "INSERT INTO benz.login_guards (key) VALUES ($1) ON CONFLICT DO NOTHING",
        [key],
      );
      const guard = (
        await db.query(
          "SELECT * FROM benz.login_guards WHERE key=$1 FOR UPDATE",
          [key],
        )
      ).rows[0];
      if (guard.locked)
        return {
          error: new HttpError(
            423,
            "Acesso bloqueado. Use o e-mail de recuperação para liberar sua conta.",
            "ACCOUNT_LOCKED",
          ),
        };
      const client = authClient(),
        result = await client.auth.signInWithPassword({ email, password });
      if (result.error || !result.data.session) {
        if (
          result.error &&
          ((result.error.status ?? 0) >= 500 ||
            result.error.name === "AuthRetryableFetchError")
        )
          return {
            error: new HttpError(
              503,
              "Autenticação temporariamente indisponível. Tente novamente.",
            ),
          };
        if (result.error?.code === "invalid_credentials") {
          await db.query(
            "UPDATE benz.login_guards SET failures=LEAST(failures+1,5), locked=(failures+1>=5), updated_at=now() WHERE key=$1",
            [key],
          );
          // Revoke existing app sessions as soon as the fifth failure locks this account.
          if (guard.failures >= 4)
            await db.query(
              "DELETE FROM benz.sessions WHERE user_id IN (SELECT id FROM benz.profiles WHERE email=$1)",
              [email],
            );
        }
        return {
          error: new HttpError(
            result.error?.status === 429 ? 429 : 401,
            "E-mail ou senha inválidos, ou e-mail ainda não confirmado. Após cinco erros, recupere o acesso pelo e-mail.",
          ),
        };
      }
      if (!result.data.user.email_confirmed_at)
        return {
          error: new HttpError(403, "Confirme seu e-mail para continuar."),
        };
      await db.query(
        "UPDATE benz.login_guards SET failures=0, updated_at=now() WHERE key=$1",
        [key],
      );
      return { session: result.data.session };
    });
    if (result.error) throw result.error;
    await createSession(res, result.session!, "login", req);
    // The response never includes Supabase access/refresh tokens.
    return { ok: true };
  }
  static async recover(body: unknown) {
    const { email } = z.object({ email: emailSchema }).strict().parse(body);
    const { error } = await authClient().auth.resetPasswordForEmail(email, {
      redirectTo: env.publicAppUrl,
    });
    if (error && (error.status ?? 0) >= 500)
      throw new HttpError(
        503,
        "Não foi possível enviar o e-mail. Tente mais tarde.",
      );
    if (error?.status === 429)
      throw new HttpError(429, "Aguarde antes de pedir outro e-mail.");
    return {
      message:
        "Se houver uma conta para este e-mail, enviaremos um link para redefinir a senha e liberar o acesso.",
    };
  }
  static async resend(body: unknown) {
    const { email } = z.object({ email: emailSchema }).strict().parse(body);
    await authClient().auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: env.publicAppUrl },
    });
    return {
      message: "Se houver confirmação pendente, enviaremos um novo link.",
    };
  }
  static async confirm(body: unknown, req: Request, res: Response) {
    const { tokenHash, type } = z
      .object({
        tokenHash: z.string().min(20).max(256),
        type: z.enum(["signup", "recovery"]),
      })
      .strict()
      .parse(body);
    const { data, error } = await authClient().auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (error || !data.session)
      throw new HttpError(
        400,
        "Link inválido ou expirado. Solicite outro e-mail.",
      );
    if (type === "signup") {
      // Confirmation proves ownership; login still requires the password/Google and MFA.
      return { message: "E-mail confirmado. Entre na sua conta." };
    }
    await database.query("DELETE FROM benz.sessions WHERE user_id=$1", [
      data.user!.id,
    ]);
    await createSession(res, data.session, "recovery", req);
    return { recovery: true };
  }
  static async resetPassword(
    body: unknown,
    ctx: SessionContext,
    res: Response,
  ) {
    if (ctx.purpose !== "recovery")
      throw new HttpError(403, "Use o link enviado para seu e-mail.");
    const { password } = z
      .object({ password: passwordSchema })
      .strict()
      .parse(body);
    if (ctx.factorId && ctx.mfaRequired)
      throw new HttpError(
        403,
        "Confirme também seu código de segurança.",
        "MFA_REQUIRED",
      );
    const result = await ctx.client.auth.updateUser({ password });
    if (result.error)
      throw new HttpError(
        400,
        "Não foi possível redefinir. Use uma senha nova de 12 a 72 bytes ou solicite outro link.",
      );
    await database.transaction(async (db) => {
      await db.query(
        "UPDATE benz.login_guards SET failures=0,locked=false,updated_at=now() WHERE key=$1",
        [identityKey(ctx.user.email!.toLowerCase())],
      );
      await db.query("DELETE FROM benz.sessions WHERE user_id=$1", [
        ctx.user.id,
      ]);
    });
    await ctx.client.auth.signOut({ scope: "global" });
    return { message: "Senha redefinida e acesso liberado. Entre novamente." };
  }
  static async challenge(body: unknown, ctx: SessionContext) {
    const { phone } = z
      .object({
        phone: z
          .string()
          .regex(/^\+[1-9]\d{7,14}$/)
          .optional(),
      })
      .strict()
      .parse(body);
    let factorId = ctx.factorId;
    if (!factorId) {
      if (ctx.purpose !== "login" || !phone)
        throw new HttpError(
          400,
          "Informe seu celular com DDI, como +5511999999999.",
        );
      const list = await ctx.client.auth.mfa.listFactors();
      if (list.error)
        throw new HttpError(
          503,
          "Não foi possível verificar os fatores de segurança.",
        );
      // Clean only unverified phone enrollments; never replace an existing verified factor.
      for (const f of list.data.all.filter(
        (f) => f.status === "unverified" && f.factor_type === "phone",
      )) {
        const removed = await ctx.client.auth.mfa.unenroll({ factorId: f.id });
        if (removed.error)
          throw new HttpError(400, "Não foi possível preparar a verificação.");
      }
      const enrolled = await ctx.client.auth.mfa.enroll({
        factorType: "phone",
        phone,
        friendlyName: "Celular",
      });
      if (enrolled.error)
        throw new HttpError(
          400,
          "Não foi possível cadastrar o celular. Verifique o número ou fale com o suporte.",
        );
      factorId = enrolled.data.id;
    } else if (phone) throw new HttpError(400, "Use o celular já cadastrado.");
    const result = await ctx.client.auth.mfa.challenge({ factorId });
    if (result.error)
      throw new HttpError(
        429,
        "Não foi possível enviar o código. Aguarde e tente novamente.",
      );
    await database.query(
      "UPDATE benz.sessions SET mfa_factor_id=$1,mfa_challenge_id=$2 WHERE token_hash=$3",
      [factorId, result.data.id, ctx.hash],
    );
    return { factorId, challengeId: result.data.id };
  }
  static async verifyMfa(body: unknown, ctx: SessionContext) {
    const { factorId, challengeId, code } = z
      .object({
        factorId: z.string().uuid(),
        challengeId: z.string().uuid(),
        code: z.string().regex(/^\d{6,8}$/),
      })
      .strict()
      .parse(body);
    const challenge = (
      await database.query(
        "SELECT mfa_factor_id,mfa_challenge_id FROM benz.sessions WHERE token_hash=$1",
        [ctx.hash],
      )
    )[0];
    if (
      !challenge ||
      challenge.mfa_factor_id !== factorId ||
      challenge.mfa_challenge_id !== challengeId
    )
      throw new HttpError(400, "Solicite um código de segurança nesta sessão.");
    // Challenge/factor ownership is enforced again by Supabase for this authenticated client.
    const result = await ctx.client.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });
    if (result.error) throw new HttpError(400, "Código inválido ou expirado.");
    await saveClientTokens(ctx);
    await database.query(
      "UPDATE benz.sessions SET mfa_factor_id=NULL,mfa_challenge_id=NULL WHERE token_hash=$1",
      [ctx.hash],
    );
    return { ok: true };
  }
}
