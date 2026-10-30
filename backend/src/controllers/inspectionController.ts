import { Request, Response, NextFunction } from 'express';
import { InspectionService } from '../services/inspectionService';

export class InspectionController {
  /**
   * POST /api/inspection/schedule
   */
  static schedule(req: Request, res: Response, next: NextFunction) {
    try {
      const result = InspectionService.schedule(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
