import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../../http/middleware/requireAuth";
import { ReportService } from "./report.service";
import { uuidSchema } from "../../shared/security";
import { rateLimit } from "../../http/middleware/security";
const router = Router();
router.get("/preview/:plate", (_req, res) => {
  res.status(402).json({ message: "Entre na conta e adquira uma consulta." });
});
router.get("/report/:plate", (_req, res) => {
  res
    .status(410)
    .json({ message: "Abra a consulta pelo histórico de compras." });
});
router.post(
  "/orders/:orderId/report",
  requireAuth,
  rateLimit("report", 20, 900),
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve()
      .then(() =>
        ReportService.consume(
          uuidSchema.parse(req.params.orderId),
          req.userId!,
        ),
      )
      .then((report) => res.json(report))
      .catch(next);
  },
);
export default router;
