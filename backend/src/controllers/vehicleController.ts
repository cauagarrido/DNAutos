import { Request, Response, NextFunction } from 'express';
import { VehicleService } from '../services/vehicleService';
import { verifyReportToken } from '../services/reportToken';
import { db } from '../services/database';

export class VehicleController {
  /**
   * GET /api/vehicle/preview/:plate
   */
  static async getPreview(req: Request, res: Response, next: NextFunction) {
    try {
      const { plate } = req.params;
      const preview = await VehicleService.getPreview(plate);
      res.json(preview);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/vehicle/report/:plate
   */
  static async getFullReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { plate } = req.params;
      const token = verifyReportToken(String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, ''));
      const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (token.plate !== clean) { res.status(403).json({ message: 'Este token não autoriza a placa informada.' }); return; }
      const payment = db.prepare('SELECT status,user_id FROM payments WHERE id=?').get(token.paymentId) as any;
      if (!payment || payment.status !== 'approved' || payment.user_id !== token.userId) { res.status(403).json({ message: 'Pagamento não confirmado.' }); return; }
      const report = await VehicleService.getFullReport(plate);
      db.prepare('INSERT OR REPLACE INTO reports (id,user_id,plate,report_json,consulted_at) VALUES (?,?,?,?,?)').run(report.id, token.userId, clean, JSON.stringify(report), report.consultedAt);
      res.json(report);
    } catch (error) {
      next(error);
    }
  }
}
