import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/security";
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const status =
    error instanceof ZodError
      ? 400
      : error instanceof HttpError
        ? error.status
        : (error as any)?.type === "entity.too.large"
          ? 413
          : 500;
  if (status >= 500)
    console.error(
      JSON.stringify({
        event: "request_error",
        requestId: res.locals.requestId,
        method: req.method,
        route: req.route?.path,
        status,
      }),
    );
  res
    .status(status)
    .json({
      message:
        error instanceof ZodError
          ? "Verifique os dados informados."
          : error instanceof HttpError
            ? error.message
            : "Serviço indisponível. Tente novamente ou fale com o suporte.",
      code: error instanceof HttpError ? error.code : undefined,
      requestId: res.locals.requestId,
    });
}
