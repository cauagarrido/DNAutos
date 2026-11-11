import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { database } from "../services/database";
import { HttpError, identityKey } from "../utils/security";
export function csrfGuard(req: Request, res: Response, next: NextFunction) {
  if (
    ["GET", "HEAD", "OPTIONS"].includes(req.method) ||
    req.path === "/api/checkout/webhook"
  )
    return next();
  if (
    req.headers.origin !== new URL(env.publicAppUrl).origin ||
    req.headers["x-app-request"] !== "1"
  )
    return res.status(403).json({ message: "Origem da solicitação inválida." });
  if (!req.is("application/json"))
    return res.status(415).json({ message: "Envie JSON." });
  next();
}
export function rateLimit(bucket: string, limit: number, seconds: number) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const key = identityKey(`${bucket}:${req.ip}`);
      const rows = await database.query(
        `INSERT INTO benz.rate_limits (key, hits, reset_at)
        VALUES ($1, 1, now() + $2 * interval '1 second') ON CONFLICT (key) DO UPDATE SET
        hits = CASE WHEN benz.rate_limits.reset_at <= now() THEN 1 ELSE benz.rate_limits.hits + 1 END,
        reset_at = CASE WHEN benz.rate_limits.reset_at <= now() THEN EXCLUDED.reset_at ELSE benz.rate_limits.reset_at END RETURNING hits`,
        [key, seconds],
      );
      if (rows[0].hits > limit)
        throw new HttpError(429, "Muitas tentativas. Aguarde alguns minutos.");
      next();
    } catch (error) {
      next(error);
    }
  };
}
