import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { CheckoutService } from "./checkout.service";
import { verifySignature } from "../../integrations/mercado-pago/mercado-pago.client";
import { requireAuth } from "../../http/middleware/requireAuth";
import { rateLimit } from "../../http/middleware/security";
import { plateSchema, uuidSchema } from "../../shared/security";
const router = Router();
const run =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };
router.post(
  "/",
  requireAuth,
  rateLimit("checkout", 10, 900),
  run(async (req, res) => {
    const { plate } = z.object({ plate: plateSchema }).strict().parse(req.body);
    const key = uuidSchema.parse(req.headers["idempotency-key"]);
    res.status(201).json(await CheckoutService.create(plate, req.userId!, key));
  }),
);
router.get(
  "/status/:orderId",
  requireAuth,
  run(async (req, res) => {
    res.json(
      await CheckoutService.status(
        uuidSchema.parse(req.params.orderId),
        req.userId!,
      ),
    );
  }),
);
router.post(
  "/webhook",
  run(async (req, res) => {
    // The signed identifier MUST come from the query, never an untrusted body fallback.
    const id = req.query["data.id"],
      requestId = req.headers["x-request-id"],
      signature = req.headers["x-signature"];
    if (
      typeof id !== "string" ||
      typeof requestId !== "string" ||
      typeof signature !== "string" ||
      !verifySignature(id, requestId, signature)
    ) {
      res.sendStatus(401);
      return;
    }
    if (req.body?.data?.id !== undefined && String(req.body.data.id) !== id) {
      res.sendStatus(400);
      return;
    }
    if (req.body?.type && req.body.type !== "payment") {
      res.sendStatus(200);
      return;
    }
    await CheckoutService.enqueue(id);
    // Await all work: a serverless invocation can stop immediately after sending a response.
    await CheckoutService.processWebhook(id);
    res.sendStatus(200);
  }),
);
export default router;
