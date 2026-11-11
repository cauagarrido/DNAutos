import { database } from "../../database/client";
import { VehicleService } from "./vehicle.service";
import { env } from "../../config/env";
import { HttpError } from "../../shared/security";
export class ReportService {
  static async consume(orderId: string, userId: string) {
    const reservation = await database.transaction(async (db) => {
      const order = (
        await db.query(
          "SELECT * FROM benz.orders WHERE id=$1 AND user_id=$2 FOR UPDATE",
          [orderId, userId],
        )
      ).rows[0];
      if (!order) throw new HttpError(404, "Compra não encontrada.");
      if (order.status !== "approved")
        throw new HttpError(
          402,
          "Pagamento ainda não confirmado ou acesso suspenso.",
        );
      const cached = (
        await db.query(
          "SELECT report_json FROM benz.reports WHERE order_id=$1 AND user_id=$2",
          [orderId, userId],
        )
      ).rows[0];
      if (cached) return { cached: cached.report_json };
      const refund = (
        await db.query(
          "SELECT id FROM benz.support_requests WHERE order_id=$1 AND kind='refund' AND status='open'",
          [orderId],
        )
      ).rows[0];
      if (refund)
        throw new HttpError(
          409,
          "Há um pedido de estorno em análise. Fale com o suporte.",
        );
      if (order.report_state !== "available")
        throw new HttpError(
          409,
          "Sua consulta está em processamento ou análise. Confira o histórico ou fale com o suporte.",
          "REPORT_REVIEW",
        );
      if (
        !env.anycarContractVerified ||
        !env.anycarApiUrl ||
        !env.anycarApiKey ||
        !env.anycarReportTypes.length
      )
        throw new HttpError(
          503,
          "O provedor está indisponível. Sua compra foi preservada.",
        );
      await db.query(
        "UPDATE benz.orders SET report_state='processing',query_started_at=now(),updated_at=now() WHERE id=$1",
        [orderId],
      );
      return { plate: order.plate };
    });
    if (reservation.cached) return reservation.cached;
    try {
      // Never automatically repeat a billable provider request on timeout/unknown outcome.
      const report = await VehicleService.getFullReport(reservation.plate!);
      await database.transaction(async (db) => {
        await db.query(
          "INSERT INTO benz.reports (order_id,user_id,report_json) VALUES ($1,$2,$3::jsonb)",
          [orderId, userId, JSON.stringify(report)],
        );
        await db.query(
          "UPDATE benz.orders SET report_state='complete',updated_at=now() WHERE id=$1",
          [orderId],
        );
      });
      const current = (
        await database.query(
          "SELECT status FROM benz.orders WHERE id=$1 AND user_id=$2",
          [orderId, userId],
        )
      )[0];
      if (current.status !== "approved")
        throw new HttpError(
          402,
          "O pagamento foi suspenso. Fale com o suporte.",
        );
      return report;
    } catch (error) {
      await database.query(
        "UPDATE benz.orders SET report_state='review',updated_at=now() WHERE id=$1 AND report_state='processing'",
        [orderId],
      );
      if (error instanceof HttpError) throw error;
      throw new HttpError(
        502,
        "Não foi possível concluir a consulta. Sua compra está preservada para análise ou estorno.",
        "REPORT_REVIEW",
      );
    }
  }
}
