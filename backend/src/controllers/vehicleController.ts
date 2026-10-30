import { Request, Response, NextFunction } from 'express';
import { VehicleService } from '../services/vehicleService';
import { verifyReportToken } from '../services/reportToken';
import { dbGet, dbRun } from '../services/database';

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
      const payment = await dbGet<any>('SELECT status,user_id FROM payments WHERE id=?', [token.paymentId]);
      if (!payment || payment.status !== 'approved' || payment.user_id !== token.userId) { res.status(403).json({ message: 'Pagamento não confirmado.' }); return; }
      const report = await VehicleService.getFullReport(plate);
      await dbRun('INSERT INTO reports (id,user_id,plate,report_json,consulted_at) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET user_id=excluded.user_id, plate=excluded.plate, report_json=excluded.report_json, consulted_at=excluded.consulted_at', [report.id, token.userId, clean, JSON.stringify(report), report.consultedAt]);
      res.json(report);
    } catch (error) {
      next(error);
    }
  }
}
