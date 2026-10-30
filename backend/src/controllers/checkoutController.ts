import { Request, Response, NextFunction } from 'express';
import { CheckoutService } from '../services/checkoutService';
export class CheckoutController {
  static async create(req: Request, res: Response, next: NextFunction) { try { res.status(201).json(await CheckoutService.create(req.body.plate, req.userId!)); } catch (e) { next(e); } }
  static status(req: Request, res: Response, next: NextFunction) { try { res.json(CheckoutService.status(req.params.paymentId, req.userId!)); } catch (e) { next(e); } }
  static async webhook(req: Request, res: Response) {
    const dataId = String(req.query['data.id'] ?? req.body?.data?.id ?? '');
    const signature = String(req.headers['x-signature'] ?? ''); const requestId = String(req.headers['x-request-id'] ?? '');
    if (!dataId || !CheckoutService.verifyWebhookSignature(dataId, requestId, signature)) { res.sendStatus(401); return; }
    try { await CheckoutService.processWebhook(dataId); res.sendStatus(200); } catch { res.sendStatus(500); }
  }
}
