import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';
declare global { namespace Express { interface Request { userId?: string } } }
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authorization = req.headers.authorization ?? '';
    const payload = verifyToken(authorization.replace(/^Bearer\s+/i, ''));
    if (payload.type !== 'session') throw new Error('Sessão inválida.');
    req.userId = payload.sub;
    next();
  } catch { res.status(401).json({ message: 'Faça login para continuar.' }); }
}
