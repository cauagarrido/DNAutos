import { Request, Response, NextFunction } from "express";
import {
  restoreSession,
  SessionContext,
  clearCookie,
} from "../services/sessionService";
import { HttpError } from "../utils/security";
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      auth?: SessionContext;
    }
  }
}
export async function requireSession(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    req.auth = await restoreSession(req);
    req.userId = req.auth.user.id;
    next();
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) clearCookie(res);
    next(error);
  }
}
export function requireVerified(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (!req.auth || req.auth.purpose !== "login")
    return next(new HttpError(403, "Conclua a recuperação e entre novamente."));
  if (req.auth.mfaRequired)
    return next(
      new HttpError(
        403,
        "Confirme o código de segurança para continuar.",
        "MFA_REQUIRED",
      ),
    );
  next();
}
export const requireAuth = [requireSession, requireVerified];
