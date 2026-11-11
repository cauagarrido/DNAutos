import { test, before, beforeEach, after, mock } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID, createHmac } from "node:crypto";
import request from "supertest";
import { PGlite } from "@electric-sql/pglite";
import { database } from "../src/database/client";
import { env, IDLE_MS, PRICE_CENTS } from "../src/config/env";
import {
  digest,
  seal,
  unseal,
  passwordSchema,
  plateSchema,
} from "../src/shared/security";
import {
  verifySignature,
  mercadoPago,
} from "../src/integrations/mercado-pago/mercado-pago.client";
import { CheckoutService } from "../src/modules/checkout/checkout.service";
import { ReportService } from "../src/modules/vehicle/report.service";
import { VehicleService } from "../src/modules/vehicle/vehicle.service";
import { isIdle } from "../src/modules/auth/session.service";
import app from "../src/app";
import { AnycarService } from "../src/integrations/anycar/anycar.client";
import axios from "axios";
import { FipeService } from "../src/integrations/fipe/fipe.client";

const userId = "11111111-1111-4111-8111-111111111111",
  otherId = "22222222-2222-4222-8222-222222222222";
const db = new PGlite();
let factorVerified = false,
  aal = "aal1",
  passwordCalls = 0,
  gatewayCalls = 0,
  providerCalls = 0,
  authOutage = false;
const factorId = "33333333-3333-4333-8333-333333333333",
  challengeId = "44444444-4444-4444-8444-444444444444";
const user = () => ({
  id: userId,
  email: "cliente@example.com",
  email_confirmed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  aud: "authenticated",
  role: "authenticated",
  app_metadata: {},
  user_metadata: {},
  factors: factorVerified
    ? [
        {
          id: factorId,
          factor_type: "phone",
          status: "verified",
          friendly_name: "Celular",
          phone: "+5511999999999",
        },
      ]
    : [],
});
const jwt = () =>
  [
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
      "base64url",
    ),
    Buffer.from(
      JSON.stringify({
        sub: userId,
        aal,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        amr: [{ method: "password", timestamp: Math.floor(Date.now() / 1000) }],
      }),
    ).toString("base64url"),
    "c2lnbmF0dXJl",
  ].join(".");
const session = () => ({
  access_token: jwt(),
  refresh_token: "fake-refresh-token",
  expires_in: 3600,
  token_type: "bearer",
  user: user(),
});
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Supabase-Api-Version": "2024-01-01",
    },
  });
const origin = () => env.publicAppUrl;
const post = (url: string, body: unknown, cookie?: string) => {
  const req = request(app)
    .post(url)
    .set("Origin", origin())
    .set("X-App-Request", "1");
  if (cookie) req.set("Cookie", cookie);
  return req.send(body);
};
async function login() {
  const result = await post("/api/auth/login", {
    email: "cliente@example.com",
    password: "senha-correta-123",
  });
  assert.equal(result.status, 200, JSON.stringify(result.body));
  return String(result.headers["set-cookie"][0]).split(";")[0];
}
async function order(status = "pending", owner = userId) {
  const id = randomUUID();
  await db.query(
    "INSERT INTO benz.orders (id,user_id,request_key,plate,status) VALUES ($1,$2,$3,$4,$5)",
    [id, owner, randomUUID(), "ABC1D23", status],
  );
  return id;
}
before(async () => {
  Object.assign(env, {
    databaseUrl: "postgres://test:test@localhost/test",
    supabaseUrl: "https://example.supabase.co",
    supabaseKey: "test-publishable",
    sessionKey: Buffer.alloc(32, 7).toString("base64"),
    authRateSecret: "a".repeat(40),
    requirePhoneMfa: false,
    checkoutEnabled: true,
    anycarContractVerified: true,
    anycarApiUrl: "https://anycar.invalid",
    anycarApiKey: "test",
    anycarReportTypes: ["test"],
    supportUrl: "https://example.com/support",
    mercadoPagoAccessToken: "test",
    mercadoPagoWebhookSecret: "webhook-test-secret",
    mercadoPagoCollectorId: "1234",
    mercadoPagoLiveMode: false,
  });
  await db.exec(
    "CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);",
  );
  await db.exec(
    readFileSync(
      "../supabase/migrations/20261111173427_secure_vehicle_platform.sql",
      "utf8",
    ),
  );
  mock.method(
    database,
    "query",
    async (sql: string, params: unknown[] = []) =>
      (await db.query(sql, params)).rows,
  );
  mock.method(database, "transaction", async (work: any) =>
    db.transaction(async (tx) =>
      work({
        query: (sql: string, params: unknown[] = []) => tx.query(sql, params),
      }),
    ),
  );
  mock.method(globalThis, "fetch", async (input: any, init: any) => {
    const url = String(input),
      body = init?.body ? JSON.parse(init.body) : {};
    if (url.includes("/token")) {
      if (body.auth_code === "fake-code" && body.code_verifier)
        return reply(session());
      passwordCalls++;
      return body.password === "senha-correta-123"
        ? reply(session())
        : reply(
            { code: "invalid_credentials", msg: "Invalid login credentials" },
            400,
          );
    }
    if (new URL(url).pathname === "/auth/v1/user")
      return authOutage
        ? reply({ message: "unavailable" }, 503)
        : reply(user());
    if (new URL(url).pathname === "/auth/v1/factors")
      return reply({ id: factorId, factor_type: "phone", phone: body.phone });
    if (new URL(url).pathname === "/auth/v1/signup")
      return reply({ user: user(), session: null });
    if (new URL(url).pathname === "/auth/v1/verify") return reply(session());
    if (
      url.includes("/recover") ||
      url.includes("/resend") ||
      url.includes("/logout")
    )
      return reply({});
    if (url.includes("/factors/") && url.endsWith("/challenge"))
      return reply({
        id: challengeId,
        type: "phone",
        expires_at: Math.floor(Date.now() / 1000) + 300,
      });
    if (url.includes("/factors/") && url.endsWith("/verify")) {
      aal = "aal2";
      factorVerified = true;
      return reply(session());
    }
    throw new Error("Unexpected Supabase request: " + url);
  });
  mock.method(VehicleService, "getFullReport", async (plate: string) => {
    providerCalls++;
    return {
      id: "REPORT-1",
      consultedAt: new Date().toISOString(),
      basicInfo: { plate },
      risks: { riskScore: null },
    } as any;
  });
});
beforeEach(async () => {
  await db.exec(
    "TRUNCATE benz.support_requests,benz.reports,benz.orders,benz.sessions,benz.profiles,benz.login_guards,benz.rate_limits,benz.webhook_jobs,auth.users CASCADE",
  );
  await db.query("INSERT INTO auth.users (id) VALUES ($1),($2)", [
    userId,
    otherId,
  ]);
  await db.query("INSERT INTO benz.profiles(id,email) VALUES ($1,$2),($3,$4)", [
    userId,
    "cliente@example.com",
    otherId,
    "outro@example.com",
  ]);
  factorVerified = false;
  authOutage = false;
  aal = "aal1";
  env.nodeEnv = "development";
  env.requirePhoneMfa = false;
  env.publicAppUrl = "http://localhost:5110";
  env.publicApiUrl = "http://localhost:3000";
  env.checkoutEnabled = true;
  passwordCalls = 0;
  gatewayCalls = 0;
  providerCalls = 0;
});
after(async () => {
  mock.restoreAll();
  await db.close();
});

test("price and plate validation reject manipulation and invalid formats", () => {
  assert.equal(PRICE_CENTS, 5000);
  assert.equal(plateSchema.parse("abc-1d23"), "ABC1D23");
  assert.throws(() => plateSchema.parse("1234567"));
  assert.throws(() => passwordSchema.parse("Ã¡".repeat(40)));
});
test("encrypted server tokens detect tampering and idle expiration is exact", () => {
  const value = seal({ access: "secret" });
  assert.deepEqual(unseal(value), { access: "secret" });
  assert.ok(!value.includes("secret"));
  assert.throws(() => unseal(value.slice(0, -4) + "AAAA"));
  const now = Date.now();
  assert.equal(isIdle(new Date(now - IDLE_MS), now), true);
  assert.equal(isIdle(new Date(now - IDLE_MS + 1), now), false);
});
test("webhook signatures reject forged, stale, mismatched and missing inputs", () => {
  const ts = String(Math.floor(Date.now() / 1000)),
    sign = createHmac("sha256", env.mercadoPagoWebhookSecret)
      .update(`id:123;request-id:req-1;ts:${ts};`)
      .digest("hex");
  assert.equal(verifySignature("123", "req-1", `ts=${ts},v1=${sign}`), true);
  assert.equal(verifySignature("999", "req-1", `ts=${ts},v1=${sign}`), false);
  assert.equal(
    verifySignature(
      "123",
      "req-1",
      `ts=${ts},v1=${sign}`,
      env.mercadoPagoWebhookSecret,
      Date.now() + 600000,
    ),
    false,
  );
  assert.equal(verifySignature("123", "", ""), false);
});
test("CSRF, public report access and signed webhook fail closed", async () => {
  assert.equal(
    (await request(app).post("/api/auth/login").send({})).status,
    403,
  );
  assert.equal(
    (await request(app).post("/api/checkout/webhook?data.id=123").send({}))
      .status,
    401,
  );
  assert.equal(
    (await post("/api/vehicle/orders/" + randomUUID() + "/report", {})).status,
    401,
  );
  assert.equal(
    (await request(app).get("/api/vehicle/report/ABC1D23")).status,
    410,
  );
  assert.equal(providerCalls, 0);
});
test("registration never logs the user in before email confirmation", async () => {
  const result = await post("/api/auth/register", {
    email: "novo@example.com",
    password: "senha-valida-123",
  });
  assert.equal(result.status, 200);
  assert.equal(result.headers["set-cookie"], undefined);
  assert.equal((await db.query("SELECT * FROM benz.sessions")).rows.length, 0);
});
test("five wrong passwords lock the account; a sixth attempt never calls the provider", async () => {
  for (let i = 0; i < 5; i++)
    assert.equal(
      (
        await post("/api/auth/login", {
          email: "cliente@example.com",
          password: "incorreta",
        })
      ).status,
      401,
    );
  assert.equal(
    (
      await post("/api/auth/login", {
        email: "cliente@example.com",
        password: "senha-correta-123",
      })
    ).status,
    423,
  );
  assert.equal(passwordCalls, 5);
});
test("successful login creates only an opaque HttpOnly cookie; server expires idle sessions", async () => {
  const cookie = await login();
  assert.ok(!cookie.includes(jwt()));
  const state = await request(app)
    .get("/api/auth/session")
    .set("Cookie", cookie);
  assert.equal(state.status, 200);
  assert.equal(state.body.user.id, userId);
  assert.equal(state.body.token, undefined);
  const row = (await db.query<any>("SELECT * FROM benz.sessions")).rows[0];
  assert.notEqual(row.encrypted_tokens, session().access_token);
  assert.equal(row.token_hash, digest(cookie.split("=")[1]));
  await db.exec(
    "UPDATE benz.sessions SET last_activity=now()-interval '31 minutes'",
  );
  assert.equal(
    (await request(app).get("/api/auth/session").set("Cookie", cookie)).status,
    401,
  );
});
test("MFA is enforced on purchases; challenges are bound to this server session", async () => {
  env.requirePhoneMfa = true;
  factorVerified = true;
  const cookie = await login();
  assert.equal(
    (await request(app).get("/api/account/orders").set("Cookie", cookie))
      .status,
    403,
  );
  const bad = await post(
    "/api/auth/mfa/verify",
    { factorId, challengeId, code: "123456" },
    cookie,
  );
  assert.equal(bad.status, 400);
  const challenge = await post("/api/auth/mfa/challenge", {}, cookie);
  assert.equal(challenge.status, 200, JSON.stringify(challenge.body));
  const verified = await post(
    "/api/auth/mfa/verify",
    { ...challenge.body, code: "123456" },
    cookie,
  );
  assert.equal(verified.status, 200);
  assert.equal(
    (await request(app).get("/api/account/orders").set("Cookie", cookie))
      .status,
    200,
  );
});
test("idempotent checkout uses server price, currency and quantity and blocks client amount", async () => {
  env.publicAppUrl = "https://app.example.com";
  env.publicApiUrl = env.publicAppUrl;
  const cookie = await login(),
    key = randomUUID();
  let payload: any;
  const stub = mock.method(
    mercadoPago,
    "post",
    async (_url: any, body: any) => {
      gatewayCalls++;
      payload = body;
      return {
        data: {
          id: "pref-1",
          sandbox_init_point:
            "https://sandbox.mercadopago.com.br/checkout/test",
        },
      };
    },
  );
  try {
    const first = await post("/api/checkout", { plate: "ABC1D23" }, cookie).set(
      "Idempotency-Key",
      key,
    );
    assert.equal(first.status, 201, JSON.stringify(first.body));
    const retry = await post("/api/checkout", { plate: "ABC1D23" }, cookie).set(
      "Idempotency-Key",
      key,
    );
    assert.equal(retry.body.orderId, first.body.orderId);
    assert.equal(gatewayCalls, 1);
    assert.equal(payload.items[0].unit_price, 50);
    assert.equal(payload.items[0].quantity, 1);
    assert.equal(payload.items[0].currency_id, "BRL");
    assert.equal(
      (
        await post(
          "/api/checkout",
          { plate: "ABC1D23", amount: 1 },
          cookie,
        ).set("Idempotency-Key", randomUUID())
      ).status,
      400,
    );
  } finally {
    stub.mock.restore();
  }
});
test("purchases and reports are scoped to the current owner", async () => {
  const cookie = await login(),
    id = await order("approved", otherId);
  assert.equal(
    (
      await request(app)
        .get("/api/checkout/status/" + id)
        .set("Cookie", cookie)
    ).status,
    404,
  );
  assert.equal(
    (await post("/api/vehicle/orders/" + id + "/report", {}, cookie)).status,
    404,
  );
  assert.equal(providerCalls, 0);
});
test("pending order never calls ANYCAR; one approval generates one persisted report", async () => {
  const cookie = await login(),
    id = await order();
  assert.equal(
    (await post("/api/vehicle/orders/" + id + "/report", {}, cookie)).status,
    402,
  );
  assert.equal(providerCalls, 0);
  await db.query("UPDATE benz.orders SET status='approved' WHERE id=$1", [id]);
  const first = await post("/api/vehicle/orders/" + id + "/report", {}, cookie);
  assert.equal(first.status, 200, JSON.stringify(first.body));
  const second = await post(
    "/api/vehicle/orders/" + id + "/report",
    {},
    cookie,
  );
  assert.equal(second.status, 200);
  assert.equal(providerCalls, 1);
});
test("provider timeout preserves purchase for manual review and cannot trigger another charge", async () => {
  const id = await order("approved"),
    stub = mock.method(VehicleService, "getFullReport", async () => {
      providerCalls++;
      throw new Error("timeout");
    });
  try {
    await assert.rejects(() => ReportService.consume(id, userId));
    await assert.rejects(() => ReportService.consume(id, userId));
    const state = (
      await db.query<any>(
        "SELECT report_state,status FROM benz.orders WHERE id=$1",
        [id],
      )
    ).rows[0];
    assert.equal(state.report_state, "review");
    assert.equal(state.status, "approved");
    assert.equal(providerCalls, 1);
  } finally {
    stub.mock.restore();
  }
});
test("signed webhook verifies seller, amount, currency and live mode; duplicate events grant no extra credit", async () => {
  const id = await order();
  let amount = 1,
    status = "approved",
    currency = "BRL",
    collector = "1234",
    live = false;
  const stub = mock.method(mercadoPago, "get", async () => ({
    data: {
      id: 123,
      external_reference: id,
      transaction_amount: amount,
      currency_id: currency,
      collector_id: collector,
      live_mode: live,
      status,
    },
  }));
  try {
    await CheckoutService.enqueue("123");
    for (const mutate of [
      () => {},
      () => {
        amount = 50;
        currency = "USD";
      },
      () => {
        currency = "BRL";
        collector = "bad";
      },
      () => {
        collector = "1234";
        live = true;
      },
    ]) {
      mutate();
      await assert.rejects(() => CheckoutService.processWebhook("123"));
      assert.equal(
        (
          await db.query<any>("SELECT status FROM benz.orders WHERE id=$1", [
            id,
          ])
        ).rows[0].status,
        "pending",
      );
    }
    live = false;
    await CheckoutService.processWebhook("123");
    await CheckoutService.processWebhook("123");
    assert.equal(
      (await db.query<any>("SELECT status FROM benz.orders WHERE id=$1", [id]))
        .rows[0].status,
      "approved",
    );
    status = "refunded";
    await CheckoutService.processWebhook("123");
    status = "approved";
    await CheckoutService.processWebhook("123");
    assert.equal(
      (await db.query<any>("SELECT status FROM benz.orders WHERE id=$1", [id]))
        .rows[0].status,
      "refunded",
    );
    await assert.rejects(() => ReportService.consume(id, userId));
    assert.equal(providerCalls, 0);
  } finally {
    stub.mock.restore();
  }
});
test("support records an idempotent refund request and pauses unused report consumption", async () => {
  const id = await order("approved"),
    cookie = await login();
  const body = {
    orderId: id,
    kind: "refund",
    message: "Desisti da compra e solicito estorno.",
  };
  const first = await post("/api/account/support", body, cookie),
    second = await post("/api/account/support", body, cookie);
  assert.equal(first.status, 201);
  assert.equal(first.body.protocol, second.body.protocol);
  assert.equal(
    (await post("/api/vehicle/orders/" + id + "/report", {}, cookie)).status,
    409,
  );
  assert.equal(providerCalls, 0);
});
test("RLS and schema privileges deny anonymous/authenticated access to private data", async () => {
  const tables = (
    await db.query<any>(
      "SELECT relname,relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='benz' AND c.relkind='r'",
    )
  ).rows;
  assert.equal(tables.length, 8);
  assert.ok(tables.every((row) => row.relrowsecurity));
  await db.exec("SET ROLE authenticated");
  try {
    await assert.rejects(() => db.query("SELECT * FROM benz.orders"));
  } finally {
    await db.exec("RESET ROLE");
  }
});

test("email recovery creates a restricted session and unlocks only after changing the password", async () => {
  await login();
  for (let i = 0; i < 5; i++)
    await post("/api/auth/login", {
      email: "cliente@example.com",
      password: "wrong",
    });
  const confirmed = await post("/api/auth/confirm", {
    tokenHash: "a".repeat(64),
    type: "recovery",
  });
  assert.equal(confirmed.status, 200, JSON.stringify(confirmed.body));
  const cookie = String(confirmed.headers["set-cookie"][0]).split(";")[0];
  assert.equal(
    (await request(app).get("/api/account/orders").set("Cookie", cookie))
      .status,
    403,
  );
  const changed = await post(
    "/api/auth/password",
    { password: "uma-nova-senha-123" },
    cookie,
  );
  assert.equal(changed.status, 200, JSON.stringify(changed.body));
  assert.equal(
    (await db.query<any>("SELECT locked,failures FROM benz.login_guards"))
      .rows[0].locked,
    false,
  );
  assert.equal((await db.query("SELECT * FROM benz.sessions")).rows.length, 0);
  assert.equal(
    (
      await post("/api/auth/login", {
        email: "cliente@example.com",
        password: "senha-correta-123",
      })
    ).status,
    200,
  );
});
test("production uses Secure __Host cookies and logout revokes the stored session", async () => {
  env.nodeEnv = "production";
  const result = await post("/api/auth/login", {
    email: "cliente@example.com",
    password: "senha-correta-123",
  });
  const cookie = String(result.headers["set-cookie"][0]);
  assert.ok(cookie.startsWith("__Host-benz_session="));
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /Secure/i);
  assert.match(cookie, /SameSite=Lax/i);
  assert.equal(
    (await post("/api/auth/logout", {}, cookie.split(";")[0])).status,
    200,
  );
  assert.equal(
    (
      await request(app)
        .get("/api/auth/session")
        .set("Cookie", cookie.split(";")[0])
    ).status,
    401,
  );
});
test("browser activity renews the session; reading payment status does not", async () => {
  const id = await order(),
    cookie = await login();
  await db.exec(
    "UPDATE benz.sessions SET last_activity=now()-interval '20 minutes'",
  );
  const initial = (
    await db.query<any>("SELECT last_activity FROM benz.sessions")
  ).rows[0].last_activity;
  await request(app)
    .get("/api/checkout/status/" + id)
    .set("Cookie", cookie);
  assert.equal(
    new Date(
      (await db.query<any>("SELECT last_activity FROM benz.sessions")).rows[0]
        .last_activity,
    ).getTime(),
    new Date(initial).getTime(),
  );
  assert.equal((await post("/api/auth/activity", {}, cookie)).status, 200);
  assert.notEqual(
    new Date(
      (await db.query<any>("SELECT last_activity FROM benz.sessions")).rows[0]
        .last_activity,
    ).getTime(),
    new Date(initial).getTime(),
  );
});
test("database constraint rejects an underpriced order even with a privileged connection", async () => {
  await assert.rejects(() =>
    db.query(
      "INSERT INTO benz.orders(id,user_id,request_key,plate,amount_cents) VALUES($1,$2,$3,$4,$5)",
      [randomUUID(), userId, randomUUID(), "ABC1D23", 100],
    ),
  );
});
test("a correctly signed HTTP webhook persists and applies payment without browser cooperation", async () => {
  const id = await order(),
    ts = String(Math.floor(Date.now() / 1000)),
    requestId = "test-webhook";
  const signature = createHmac("sha256", env.mercadoPagoWebhookSecret)
    .update(`id:123;request-id:${requestId};ts:${ts};`)
    .digest("hex");
  const stub = mock.method(mercadoPago, "get", async () => ({
    data: {
      id: 123,
      external_reference: id,
      transaction_amount: 50,
      currency_id: "BRL",
      collector_id: "1234",
      live_mode: false,
      status: "approved",
    },
  }));
  try {
    const result = await request(app)
      .post("/api/checkout/webhook?data.id=123")
      .set("x-request-id", requestId)
      .set("x-signature", `ts=${ts},v1=${signature}`)
      .send({
        type: "payment",
        data: { id: "123" },
        status: "rejected",
        amount: 1,
      });
    assert.equal(result.status, 200, JSON.stringify(result.body));
    assert.equal(
      (await db.query<any>("SELECT status FROM benz.orders WHERE id=$1", [id]))
        .rows[0].status,
      "approved",
    );
    assert.ok(
      (
        await db.query<any>(
          "SELECT processed_at FROM benz.webhook_jobs WHERE payment_id=$1",
          ["123"],
        )
      ).rows[0].processed_at,
    );
  } finally {
    stub.mock.restore();
  }
});
test("first phone enrollment requires a verified code before access to purchases", async () => {
  env.requirePhoneMfa = true;
  const cookie = await login();
  const challenge = await post(
    "/api/auth/mfa/challenge",
    { phone: "+5511999999999" },
    cookie,
  );
  assert.equal(challenge.status, 200, JSON.stringify(challenge.body));
  assert.equal(
    (await request(app).get("/api/account/orders").set("Cookie", cookie))
      .status,
    403,
  );
  const verified = await post(
    "/api/auth/mfa/verify",
    { ...challenge.body, code: "123456" },
    cookie,
  );
  assert.equal(verified.status, 200, JSON.stringify(verified.body));
  assert.equal(
    (await request(app).get("/api/account/orders").set("Cookie", cookie))
      .status,
    200,
  );
});
test("temporary Auth outages fail closed while preserving a valid session for retry", async () => {
  const cookie = await login();
  authOutage = true;
  assert.equal(
    (await request(app).get("/api/auth/session").set("Cookie", cookie)).status,
    503,
  );
  assert.equal((await db.query("SELECT * FROM benz.sessions")).rows.length, 1);
  authOutage = false;
  assert.equal(
    (await request(app).get("/api/auth/session").set("Cookie", cookie)).status,
    200,
  );
});
test("Google callback requires the original PKCE browser cookie and flow", async () => {
  const initial = await post("/api/auth/google", {});
  assert.equal(initial.status, 200, JSON.stringify(initial.body));
  const callback = new URL(
    new URL(initial.body.url).searchParams.get("redirect_to")!,
  );
  const cookie = String(initial.headers["set-cookie"][0]).split(";")[0];
  const path = callback.pathname + callback.search + "&code=fake-code";
  const invalid = await request(app).get(path);
  assert.equal(invalid.status, 302);
  assert.match(invalid.headers.location, /auth=error/);
  const valid = await request(app).get(path).set("Cookie", cookie);
  assert.equal(valid.status, 302);
  assert.match(valid.headers.location, /auth=google/);
  assert.equal((await db.query("SELECT * FROM benz.sessions")).rows.length, 1);
});
test("ANYCAR normalizer preserves unknown risks and omits raw personal data", async () => {
  const stub = mock.method(axios, "post", async () => ({
    data: {
      status: true,
      dados: {
        riscos: {
          rouboFurto: "não informado",
          sinistro: { hasAccident: true },
          leilao: { hasAuction: true },
        },
        financeiro: { total: 0 },
        proprietario: { cpf: "12345678900" },
      },
    },
  }));
  try {
    const report = await AnycarService.getFullReport("ABC1D23");
    assert.equal(report.risks.theftRecord.isStolenOrTheftAlert, null);
    assert.equal(report.risks.accident.severity, undefined);
    assert.equal(report.risks.auction.auctionScoreRisk, null);
    assert.equal(report.financial.ipvaStatus, "Não informado");
    assert.equal(report.providerData, undefined);
    assert.ok(!JSON.stringify(report).includes("12345678900"));
  } finally {
    stub.mock.restore();
  }
});
test("all account, payment and report routes require an authenticated server session", async () => {
  const id = randomUUID();
  for (const route of [
    "/api/auth/session",
    "/api/auth/reports",
    "/api/account/orders",
    "/api/checkout/status/" + id,
  ])
    assert.equal((await request(app).get(route)).status, 401, route);
  for (const route of [
    "/api/checkout",
    "/api/account/support",
    "/api/vehicle/orders/" + id + "/report",
    "/api/auth/activity",
    "/api/auth/password",
    "/api/auth/mfa/challenge",
    "/api/auth/mfa/verify",
    "/api/auth/logout",
  ])
    assert.equal((await post(route, {})).status, 401, route);
});
test("HTTP payload limits, JSON validation and CSRF reject invalid requests without leaking details", async () => {
  const invalid = await request(app)
    .post("/api/auth/login")
    .set("Origin", origin())
    .set("X-App-Request", "1")
    .set("Content-Type", "application/json")
    .send("{broken");
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.stack, undefined);
  const large = await post("/api/auth/login", { email: "x".repeat(17000) });
  assert.equal(large.status, 413);
  const foreign = await request(app)
    .post("/api/auth/login")
    .set("Origin", "https://attacker.example")
    .set("X-App-Request", "1")
    .send({});
  assert.equal(foreign.status, 403);
  const missing = await request(app)
    .post("/api/auth/login")
    .set("Origin", origin())
    .send({});
  assert.equal(missing.status, 403);
  const form = await request(app)
    .post("/api/auth/login")
    .set("Origin", origin())
    .set("X-App-Request", "1")
    .type("form")
    .send({ email: "x" });
  assert.equal(form.status, 415);
});
test("forwarded IP spoofing cannot bypass the application rate limiter", async () => {
  for (let i = 0; i < 5; i++)
    assert.equal(
      (
        await post("/api/auth/register", {
          email: "novo@example.com",
          password: "senha-segura-123",
        }).set("X-Forwarded-For", "192.0.2." + i)
      ).status,
      200,
    );
  assert.equal(
    (
      await post("/api/auth/register", {
        email: "novo@example.com",
        password: "senha-segura-123",
      }).set("X-Forwarded-For", "198.51.100.1")
    ).status,
    429,
  );
});
test("maintenance requires its exact bearer secret and never accepts browser authentication", async () => {
  env.cronSecret = "c".repeat(40);
  assert.equal(
    (await request(app).get("/api/maintenance/reconcile")).status,
    401,
  );
  assert.equal(
    (
      await request(app)
        .get("/api/maintenance/reconcile")
        .set("Authorization", "Bearer incorrect")
    ).status,
    401,
  );
  const valid = await request(app)
    .get("/api/maintenance/reconcile")
    .set("Authorization", "Bearer " + env.cronSecret);
  assert.equal(valid.status, 200);
  assert.equal(valid.body.processed, 0);
});
test("all FIPE routes are wired to their adapter and validate query parameters before a provider call", async () => {
  const calls = [];
  const mocks = [
    mock.method(FipeService, "getBrands", async () => {
      calls.push("brands");
      return [{ codigo: "21", nome: "Marca" }];
    }),
    mock.method(FipeService, "getModels", async () => {
      calls.push("models");
      return [{ codigo: "4824", nome: "Modelo" }];
    }),
    mock.method(FipeService, "getYears", async () => {
      calls.push("years");
      return [{ codigo: "2020-1", nome: "2020" }];
    }),
    mock.method(FipeService, "getVehicleData", async () => {
      calls.push("vehicle");
      return { Marca: "Marca" };
    }),
  ];
  try {
    for (const route of [
      "/brands?tipo=carros",
      "/models?tipo=carros&brandCode=21",
      "/years?tipo=carros&brandCode=21&modelCode=4824",
      "/vehicle?tipo=carros&brandCode=21&modelCode=4824&yearCode=2020-1",
    ])
      assert.equal(
        (await request(app).get("/api/fipe" + route)).status,
        200,
        route,
      );
    assert.deepEqual(calls, ["brands", "models", "years", "vehicle"]);
    for (const route of [
      "/brands?tipo=invalid",
      "/models?brandCode=..%2Fprivate",
      "/years?brandCode=21",
      "/vehicle?brandCode=21&modelCode=4824&yearCode=..%2Fprivate",
    ])
      assert.equal(
        (await request(app).get("/api/fipe" + route)).status,
        400,
        route,
      );
    assert.equal(calls.length, 4);
  } finally {
    mocks.forEach((stub) => stub.mock.restore());
  }
});
test("restricted runtime role has access to app data but no access to Supabase auth data", async () => {
  await db.exec(readFileSync("../supabase/runtime-role.sql", "utf8"));
  await db.exec("SET ROLE benz_backend");
  try {
    assert.equal(
      (await db.query("SELECT * FROM benz.profiles")).rows.length,
      2,
    );
    await assert.rejects(() => db.query("SELECT * FROM auth.users"));
  } finally {
    await db.exec("RESET ROLE");
  }
});
