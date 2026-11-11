import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { HttpError } from "../../shared/security";
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const parseError = error as { type?: string };
  const bodyStatus =
    parseError?.type === "entity.parse.failed"
      ? 400
      : parseError?.type === "entity.too.large"
        ? 413
        : parseError?.type === "encoding.unsupported"
          ? 415
          : undefined;
  const status =
    error instanceof ZodError
      ? 400
      : error instanceof HttpError
        ? error.status
        : (bodyStatus ?? 500);
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
  res.status(status).json({
    message:
      error instanceof ZodError
        ? "Verifique os dados informados."
        : error instanceof HttpError
          ? error.message
          : bodyStatus === 400
            ? "Formato JSON inválido."
            : bodyStatus === 413
              ? "Solicitação excede o tamanho permitido."
              : bodyStatus === 415
                ? "Codificação da solicitação não suportada."
                : "Serviço indisponível. Tente novamente ou fale com o suporte.",
    code: error instanceof HttpError ? error.code : undefined,
    requestId: res.locals.requestId,
  });
}
