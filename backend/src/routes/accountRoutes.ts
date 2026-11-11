import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireAuth } from "../middlewares/requireAuth";
import { rateLimit } from "../middlewares/security";
import { database } from "../services/database";
import { HttpError, uuidSchema } from "../utils/security";
const router = Router();
router.use(requireAuth);
router.get("/orders", async (req, res, next) => {
  try {
    const cursor = z.coerce
      .number()
      .int()
      .min(0)
      .max(100000)
      .default(0)
      .parse(req.query.offset);
    const rows = await database.query(
      `SELECT o.id,o.plate,o.amount_cents AS "amountCents",o.status,o.report_state AS "reportState",
      o.created_at AS "createdAt",o.expires_at AS "expiresAt",
      CASE WHEN o.status='pending' AND o.expires_at>now() THEN o.checkout_url ELSE NULL END AS "checkoutUrl",
      EXISTS(SELECT 1 FROM benz.support_requests s WHERE s.order_id=o.id AND s.status='open' AND s.kind='refund') AS "refundRequested"
      FROM benz.orders o WHERE o.user_id=$1 ORDER BY o.created_at DESC,o.id DESC LIMIT 51 OFFSET $2`,
      [req.userId, cursor],
    );
    res.json({
      orders: rows.slice(0, 50),
      nextOffset: rows.length > 50 ? cursor + 50 : null,
    });
  } catch (error) {
    next(error);
  }
});
router.post(
  "/support",
  rateLimit("support", 10, 3600),
  async (req, res, next) => {
    try {
      const { orderId, kind, message } = z
        .object({
          orderId: uuidSchema,
          kind: z.enum(["refund", "error"]),
          message: z.string().trim().min(10).max(2000),
        })
        .strict()
        .parse(req.body);
      const result = await database.transaction(async (db) => {
        const order = (
          await db.query(
            "SELECT id FROM benz.orders WHERE id=$1 AND user_id=$2 FOR UPDATE",
            [orderId, req.userId],
          )
        ).rows[0];
        if (!order) throw new HttpError(404, "Compra não encontrada.");
        const existing = (
          await db.query(
            "SELECT id FROM benz.support_requests WHERE order_id=$1 AND kind=$2 AND status='open'",
            [orderId, kind],
          )
        ).rows[0];
        if (existing) return existing.id;
        const id = randomUUID();
        await db.query(
          "INSERT INTO benz.support_requests (id,user_id,order_id,kind,message) VALUES ($1,$2,$3,$4,$5)",
          [id, req.userId, orderId, kind, message],
        );
        return id;
      });
      res
        .status(201)
        .json({
          protocol: result,
          message:
            "Solicitação registrada. Use o contato direto para acompanhar. O estorno depende da análise e confirmação no Mercado Pago.",
        });
    } catch (error) {
      next(error);
    }
  },
);
export default router;
