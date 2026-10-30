import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { dbAll, dbRun } from '../services/database';
export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) { try { res.status(201).json(await AuthService.register(req.body.name, req.body.email, req.body.password)); } catch (e) { next(e); } }
  static async login(req: Request, res: Response, next: NextFunction) { try { res.json(await AuthService.login(req.body.email, req.body.password)); } catch (e) { next(e); } }
  static async reports(req: Request, res: Response, next: NextFunction) {
    try {
    const rows = await dbAll<{ report_json: string }>('SELECT report_json FROM reports WHERE user_id=? ORDER BY consulted_at DESC LIMIT 50', [req.userId!]);
    res.json(rows.map((row) => JSON.parse(row.report_json)));
    } catch (e) { next(e); }
  }
  static async clearReports(req: Request, res: Response, next: NextFunction) { try { await dbRun('DELETE FROM reports WHERE user_id=?', [req.userId!]); res.sendStatus(204); } catch (e) { next(e); } }
}
