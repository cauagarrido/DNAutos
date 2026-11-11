import {
  env,
  authConfigured,
  checkoutConfigured,
  PRICE_CENTS,
} from "../src/config/env";
import { getPool } from "../src/database/client";
async function main() {
  const checks: Record<string, boolean> = {
    auth: authConfigured(),
    checkout: checkoutConfigured(),
    https:
      env.publicAppUrl.startsWith("https://") &&
      env.publicApiUrl.startsWith("https://"),
    sameOrigin:
      new URL(env.publicAppUrl).origin === new URL(env.publicApiUrl).origin,
    mfa: env.requirePhoneMfa,
    price: PRICE_CENTS === 5000,
    contact: /^https:\/\//.test(env.supportUrl),
  };
  if (env.databaseUrl) {
    try {
      const db = getPool(),
        result = await db.query(
          "SELECT count(*)::int AS total FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='benz' AND c.relkind='r' AND c.relrowsecurity",
        );
      checks.migration = result.rows[0].total === 8;
      const role = await db.query(
        "SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user",
      );
      checks.restrictedRole =
        !role.rows[0].rolsuper && !role.rows[0].rolbypassrls;
      await db.end();
    } catch {
      checks.database = false;
    }
  } else checks.database = false;
  // Print only boolean readiness checks, never credentials, connection strings or user data.
  console.table(checks);
  process.exitCode = Object.values(checks).every(Boolean) ? 0 : 1;
}
main().catch(() => {
  console.error("configuration_check_failed");
  process.exitCode = 1;
});
