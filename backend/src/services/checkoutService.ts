import { randomUUID } from "node:crypto";
import { database } from "./database";
import { env, checkoutConfigured, PRICE_CENTS } from "../config/env";
import { HttpError } from "../utils/security";
import { mercadoPago, gatewayHeaders, verifiedPayment } from "./mercadoPago";
export class CheckoutService {
  static async create(plate: string, userId: string, requestKey: string) {
    if (!checkoutConfigured())
      throw new HttpError(
        503,
        "As consultas estão em preparação. Nenhuma cobrança foi criada.",
      );
    return database.transaction(async (db) => {
      await db.query(
        "INSERT INTO benz.orders (id,user_id,request_key,plate) VALUES ($1,$2,$3,$4) ON CONFLICT (user_id,request_key) DO NOTHING",
        [randomUUID(), userId, requestKey, plate],
      );
      const row = (
        await db.query(
          "SELECT * FROM benz.orders WHERE user_id=$1 AND request_key=$2 FOR UPDATE",
          [userId, requestKey],
        )
      ).rows[0];
      if (row.plate !== plate)
        throw new HttpError(409, "Esta solicitação já pertence a outra placa.");
      if (
        row.status !== "pending" ||
        new Date(row.expires_at).getTime() <= Date.now()
      )
        throw new HttpError(
          409,
          "Compra encerrada. Confira o histórico antes de iniciar outra.",
        );
      if (!row.checkout_url) {
        const result = await mercadoPago.post(
          "/checkout/preferences",
          {
            items: [
              {
                id: "vehicle-report",
                title: `Consulta veicular ${plate}`,
                quantity: 1,
                currency_id: "BRL",
                unit_price: PRICE_CENTS / 100,
              },
            ],
            external_reference: row.id,
            metadata: { order_id: row.id },
            notification_url: `${env.publicApiUrl}/api/checkout/webhook`,
            back_urls: Object.fromEntries(
              ["success", "pending", "failure"].map((status) => [
                status,
                `${env.publicAppUrl}/?orderId=${row.id}`,
              ]),
            ),
            auto_return: "approved",
            expires: true,
            expiration_date_from: new Date().toISOString(),
            expiration_date_to: new Date(row.expires_at).toISOString(),
            payment_methods: {
              excluded_payment_types: [{ id: "ticket" }, { id: "atm" }],
              installments: 1,
            },
          },
          { headers: { ...gatewayHeaders(), "X-Idempotency-Key": row.id } },
        );
        const checkoutUrl = env.mercadoPagoLiveMode
          ? result.data.init_point
          : result.data.sandbox_init_point;
        if (
          typeof checkoutUrl !== "string" ||
          !/^https:\/\/([a-z0-9-]+\.)?mercadopago\.com\.br\//i.test(checkoutUrl)
        )
          throw new HttpError(502, "O gateway retornou um checkout inválido.");
        await db.query(
          "UPDATE benz.orders SET preference_id=$1,checkout_url=$2,updated_at=now() WHERE id=$3",
          [result.data.id, checkoutUrl, row.id],
        );
        row.checkout_url = checkoutUrl;
      }
      return {
        orderId: row.id,
        checkoutUrl: row.checkout_url,
        amountCents: PRICE_CENTS,
        plate,
        expiresAt: row.expires_at,
      };
    });
  }
  static async status(id: string, userId: string) {
    const row = (
      await database.query(
        "SELECT id,plate,status,report_state,amount_cents,expires_at,checkout_url FROM benz.orders WHERE id=$1 AND user_id=$2",
        [id, userId],
      )
    )[0];
    if (!row) throw new HttpError(404, "Compra não encontrada.");
    return {
      orderId: row.id,
      plate: row.plate,
      status: row.status,
      reportState: row.report_state,
      isPaid: row.status === "approved",
      amountCents: row.amount_cents,
      checkoutUrl:
        row.status === "pending" &&
        new Date(row.expires_at).getTime() > Date.now()
          ? row.checkout_url
          : null,
      expiresAt: row.expires_at,
    };
  }
  static async enqueue(paymentId: string) {
    await database.query(
      "INSERT INTO benz.webhook_jobs (payment_id) VALUES ($1) ON CONFLICT (payment_id) DO UPDATE SET received_at=now(),processed_at=NULL",
      [paymentId],
    );
  }
  static async processWebhook(paymentId: string) {
    try {
      await database.query(
        "UPDATE benz.webhook_jobs SET attempts=attempts+1 WHERE payment_id=$1",
        [paymentId],
      );
      const initial = (
        await mercadoPago.get(`/v1/payments/${paymentId}`, {
          headers: gatewayHeaders(),
        })
      ).data;
      const applied = await database.transaction(async (db) => {
        const row = (
          await db.query(
            "SELECT * FROM benz.orders WHERE id::text=$1 FOR UPDATE",
            [String(initial.external_reference || "")],
          )
        ).rows[0];
        if (!row) return false; // Payment belongs to another application using the same seller.
        // Fetch AFTER acquiring the order lock, so delayed notifications cannot apply stale snapshots.
        const payment = (
          await mercadoPago.get(`/v1/payments/${paymentId}`, {
            headers: gatewayHeaders(),
          })
        ).data;
        const status = verifiedPayment(payment, row);
        if (String(payment.id) !== paymentId)
          throw new HttpError(409, "Identificador divergente.");
        if (
          row.mp_payment_id &&
          row.mp_payment_id !== paymentId &&
          row.status === "approved"
        )
          throw new HttpError(
            409,
            "Pagamento adicional para uma compra já paga. Solicite análise.",
          );
        // Refunds, chargebacks and cancellations cannot be undone by replayed approval events.
        if (!["refunded", "charged_back", "cancelled"].includes(row.status)) {
          await db.query(
            "UPDATE benz.orders SET status=$1,mp_payment_id=$2,updated_at=now() WHERE id=$3",
            [status, paymentId, row.id],
          );
        }
        await db.query(
          "UPDATE benz.webhook_jobs SET processed_at=now(),last_error=NULL WHERE payment_id=$1",
          [paymentId],
        );
        return true;
      });
      if (!applied)
        await database.query(
          "UPDATE benz.webhook_jobs SET processed_at=now(),last_error=$2 WHERE payment_id=$1",
          [paymentId, "unrelated_reference"],
        );
    } catch (error) {
      await database.query(
        "UPDATE benz.webhook_jobs SET last_error=$2,processed_at=CASE WHEN $3 THEN now() ELSE NULL END WHERE payment_id=$1",
        [
          paymentId,
          error instanceof HttpError
            ? "payment_mismatch"
            : "gateway_unavailable",
          error instanceof HttpError,
        ],
      );
      throw error;
    }
  }
}
