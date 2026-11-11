import dotenv from "dotenv";
import path from "node:path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
export const env = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || "development",
  publicAppUrl: (process.env.PUBLIC_APP_URL || "http://localhost:5110").replace(
    /\/$/,
    "",
  ),
  publicApiUrl: (process.env.PUBLIC_API_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  ),
  databaseUrl: process.env.DATABASE_URL || "",
  databaseCa: process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n"),
  sessionKey: process.env.SESSION_ENCRYPTION_KEY || "",
  authRateSecret: process.env.AUTH_RATE_SECRET || "",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseKey: process.env.SUPABASE_PUBLISHABLE_KEY || "",
  requirePhoneMfa: process.env.REQUIRE_PHONE_MFA !== "false",
  checkoutEnabled: process.env.CHECKOUT_ENABLED === "true",
  anycarContractVerified: process.env.ANYCAR_CONTRACT_VERIFIED === "true",
  anycarApiUrl: process.env.ANYCAR_API_URL || "",
  anycarApiKey: process.env.ANYCAR_API_KEY || "",
  anycarReportTypes: (process.env.ANYCAR_REPORT_TYPES || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean),
  mercadoPagoAccessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
  mercadoPagoWebhookSecret: process.env.MERCADO_PAGO_WEBHOOK_SECRET || "",
  mercadoPagoCollectorId: process.env.MERCADO_PAGO_COLLECTOR_ID || "",
  mercadoPagoLiveMode: process.env.MERCADO_PAGO_LIVE_MODE !== "false",
  cronSecret: process.env.CRON_SECRET || "",
  supportUrl: process.env.SUPPORT_URL || "",
  fipeApiUrl:
    process.env.FIPE_API_URL || "https://fipe.parallelum.com.br/api/v2",
  fipeApiKey: process.env.FIPE_API_KEY || "",
};
export const PRICE_CENTS = 5000,
  IDLE_MS = 30 * 60_000;
export function authConfigured() {
  return !!(
    env.databaseUrl &&
    env.supabaseUrl &&
    env.supabaseKey &&
    env.authRateSecret.length >= 32 &&
    Buffer.from(env.sessionKey, "base64").length === 32
  );
}
export function checkoutConfigured() {
  return (
    authConfigured() &&
    env.checkoutEnabled &&
    env.anycarContractVerified &&
    !!(
      env.anycarApiUrl &&
      env.anycarApiKey &&
      env.anycarReportTypes.length &&
      env.supportUrl &&
      env.mercadoPagoAccessToken &&
      env.mercadoPagoWebhookSecret &&
      env.mercadoPagoCollectorId &&
      env.publicAppUrl.startsWith("https://") &&
      env.publicApiUrl.startsWith("https://")
    )
  );
}
