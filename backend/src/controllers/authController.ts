import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { db } from '../services/database';
export class AuthController {
  static register(req: Request, res: Response, next: NextFunction) { try { res.status(201).json(AuthService.register(req.body.name, req.body.email, req.body.password)); } catch (e) { next(e); } }
  static login(req: Request, res: Response, next: NextFunction) { try { res.json(AuthService.login(req.body.email, req.body.password)); } catch (e) { next(e); } }
  static reports(req: Request, res: Response) {
    const rows = db.prepare('SELECT report_json FROM reports WHERE user_id=? ORDER BY consulted_at DESC LIMIT 50').all(req.userId!) as Array<{ report_json: string }>;
    res.json(rows.map((row) => JSON.parse(row.report_json)));
  }
  static clearReports(req: Request, res: Response) { db.prepare('DELETE FROM reports WHERE user_id=?').run(req.userId!); res.sendStatus(204); }
}
