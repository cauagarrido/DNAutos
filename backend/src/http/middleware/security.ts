import { Request, Response, NextFunction } from "express";
import { env } from "../../config/env";
import { database } from "../../database/client";
import { HttpError, identityKey } from "../../shared/security";
import { createHmac, randomBytes } from "node:crypto";

/** Public read-only endpoints must not depend on Auth, database or session secrets.
 * This bounded limiter is per process; use an edge/WAF limit across replicas.
 */
export function publicRateLimit(limit: number, seconds: number) {
  const secret = randomBytes(32);
  const visitors = new Map<string, { hits: number; resetAt: number }>();
  const maxVisitors = 10_000;
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = createHmac("sha256", secret)
      .update(req.ip || "unknown")
      .digest("hex");
    let visitor = visitors.get(key);
    if (!visitor || visitor.resetAt <= now) {
      if (visitors.size >= maxVisitors) {
        for (const [id, entry] of visitors) {
          if (entry.resetAt <= now) visitors.delete(id);
        }
        if (!visitors.has(key) && visitors.size >= maxVisitors) {
          res.setHeader("Retry-After", seconds);
          return res
            .status(429)
            .json({
              message: "Muitas consultas. Tente novamente em instantes.",
            });
        }
      }
      visitor = { hits: 0, resetAt: now + seconds * 1000 };
      visitors.set(key, visitor);
    }
    if (++visitor.hits > limit) {
      res.setHeader(
        "Retry-After",
        Math.max(1, Math.ceil((visitor.resetAt - now) / 1000)),
      );
      return res
        .status(429)
        .json({ message: "Muitas consultas. Tente novamente em instantes." });
    }
    next();
  };
}
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
