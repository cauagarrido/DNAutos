import { Request, Response, NextFunction } from 'express';
import { InsuranceService } from '../services/insuranceService';

export class InsuranceController {
  /**
   * POST /api/insurance/quote
   */
  static requestQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = InsuranceService.requestQuote(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
