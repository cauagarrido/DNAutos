import { Router } from "express";
import { database } from "../../database/client";
import { CheckoutService } from "../checkout/checkout.service";
import { env } from "../../config/env";
import { safeEqual } from "../../shared/security";
const router = Router();
router.get("/reconcile", async (req, res, next) => {
  if (
    env.cronSecret.length < 32 ||
    !safeEqual(
      String(req.headers.authorization || ""),
      `Bearer ${env.cronSecret}`,
    )
  ) {
    res.sendStatus(401);
    return;
  }
  try {
    const jobs = await database.query(
      "SELECT payment_id FROM benz.webhook_jobs WHERE processed_at IS NULL AND attempts<20 ORDER BY attempts,received_at LIMIT 5",
    );
    let processed = 0;
    for (const job of jobs) {
      try {
        await CheckoutService.processWebhook(job.payment_id);
        processed++;
      } catch {
        /* durable retry on the next invocation */
      }
    }
    await database.query(
      "UPDATE benz.orders SET report_state='review',updated_at=now() WHERE report_state='processing' AND query_started_at<now()-interval '2 minutes'",
    );
    await database.query(
      "DELETE FROM benz.sessions WHERE last_activity<now()-interval '30 minutes' OR created_at<now()-interval '24 hours'",
    );
    await database.query(
      "DELETE FROM benz.rate_limits WHERE reset_at<now()-interval '1 day'",
    );
    await database.query(
      "DELETE FROM benz.login_guards WHERE locked=false AND updated_at<now()-interval '30 days'",
    );
    res.json({ processed, pending: jobs.length - processed });
  } catch (error) {
    next(error);
  }
});
export default router;
