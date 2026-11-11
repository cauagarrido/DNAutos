import { randomUUID } from "node:crypto";
import { Request, Response, NextFunction } from "express";
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  res.locals.requestId = randomUUID();
  res.setHeader("X-Request-ID", res.locals.requestId);
  res.on("finish", () =>
    console.log(
      JSON.stringify({
        requestId: res.locals.requestId,
        method: req.method,
        route: req.route?.path ?? "unknown",
        status: res.statusCode,
      }),
    ),
  );
  next(); // No URLs, plates, passwords, tokens or request bodies.
}
