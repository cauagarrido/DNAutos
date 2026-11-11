import axios from "axios";
import { createHmac } from "node:crypto";
import { env } from "../config/env";
import { safeEqual, HttpError } from "../utils/security";
export const mercadoPago = axios.create({
  baseURL: "https://api.mercadopago.com",
  timeout: 8000,
  maxRedirects: 0,
});
export const gatewayHeaders = () => ({
  Authorization: `Bearer ${env.mercadoPagoAccessToken}`,
});
export function verifySignature(
  dataId: string,
  requestId: string,
  signature: string,
  secret = env.mercadoPagoWebhookSecret,
  now = Date.now(),
) {
  if (
    !secret ||
    !/^\d{1,32}$/.test(dataId) ||
    !requestId ||
    requestId.length > 200
  )
    return false;
  const entries = signature.split(",").map((v) => v.trim().split("="));
  if (entries.length !== 2 || entries.some((v) => v.length !== 2)) return false;
  const parts = Object.fromEntries(entries);
  if (
    !/^\d{10,13}$/.test(parts.ts || "") ||
    !/^[a-f0-9]{64}$/i.test(parts.v1 || "")
  )
    return false;
  const timestamp = Number(parts.ts) * (parts.ts.length <= 10 ? 1000 : 1);
  if (Math.abs(now - timestamp) > 300_000) return false;
  const expected = createHmac("sha256", secret)
    .update(`id:${dataId};request-id:${requestId};ts:${parts.ts};`)
    .digest("hex");
  return safeEqual(expected, parts.v1.toLowerCase());
}
export function verifiedPayment(payment: any, order: any) {
  if (
    String(payment.external_reference) !== order.id ||
    !Number.isFinite(Number(payment.transaction_amount)) ||
    Number(payment.transaction_amount) !== order.amount_cents / 100 ||
    payment.currency_id !== "BRL" ||
    String(payment.collector_id) !== env.mercadoPagoCollectorId ||
    payment.live_mode !== env.mercadoPagoLiveMode ||
    !/^\d{1,32}$/.test(String(payment.id))
  )
    throw new HttpError(
      409,
      "Pagamento divergente. A liberação foi bloqueada para análise.",
    );
  const allowed = [
    "approved",
    "pending",
    "in_process",
    "authorized",
    "rejected",
    "cancelled",
    "refunded",
    "charged_back",
    "in_mediation",
  ];
  if (!allowed.includes(payment.status))
    throw new HttpError(409, "Status de pagamento desconhecido.");
  if (Number(payment.transaction_amount_refunded || 0) > 0) return "refunded";
  return ["in_process", "authorized"].includes(payment.status)
    ? "pending"
    : payment.status;
}
