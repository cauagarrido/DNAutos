import { test, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { once } from "node:events";
import express, { type Express } from "express";
import request from "supertest";
import { env } from "../src/config/env";
import { database } from "../src/database/client";
import { publicRateLimit } from "../src/http/middleware/security";

let app: Express, provider: Server;
const deliveries: string[] = [];
const price = {
  price: "R$ 70.000,00",
  brand: "Fiat",
  model: "Argo",
  modelYear: 2024,
  fuel: "Gasolina",
  codeFipe: "001000-1",
  referenceMonth: "novembro de 2026",
  vehicleType: 1,
  fuelAcronym: "G",
};

before(async () => {
  provider = createServer((req, res) => {
    deliveries.push(req.url!);
    const responses: Record<string, unknown> = {
      "/cars/brands": [{ code: "21", name: "Fiat" }],
      "/cars/brands/21/models": [{ code: "1", name: "Argo" }],
      "/cars/brands/21/models/1/years": [
        { code: "2024-1", name: "2024 Gasolina" },
      ],
      "/cars/brands/21/models/1/years/2024-1": price,
    };
    res.writeHead(req.url! in responses ? 200 : 501, {
      "Content-Type": "application/json",
    });
    res.end(
      JSON.stringify(responses[req.url!] ?? { message: "Unmodeled request" }),
    );
  });
  provider.listen(0, "127.0.0.1");
  await once(provider, "listening");
  const port = (provider.address() as { port: number }).port;
  Object.assign(env, {
    fipeApiUrl: `http://127.0.0.1:${port}`,
    fipeApiKey: "",
    databaseUrl: "",
    authRateSecret: "",
    sessionKey: "",
    supabaseUrl: "",
    supabaseKey: "",
    checkoutEnabled: false,
  });
  mock.method(database, "query", async () => {
    throw new Error("Public FIPE must not access the database");
  });
  app = (await import("../src/app")).default;
});

after(async () => {
  mock.restoreAll();
  await new Promise<void>((resolve, reject) =>
    provider.close((error) => (error ? reject(error) : resolve())),
  );
});

test("anonymous FIPE completes all four real HTTP adapter calls without Auth, database or payment", async () => {
  const endpoints = [
    "/brands?tipo=carros",
    "/models?tipo=carros&brandCode=21",
    "/years?tipo=carros&brandCode=21&modelCode=1",
    "/vehicle?tipo=carros&brandCode=21&modelCode=1&yearCode=2024-1",
  ];
  const results = [];
  for (const endpoint of endpoints) {
    const response = await request(app)
      .get("/api/fipe" + endpoint)
      .set("Cookie", "unrelated=invalid");
    assert.equal(response.status, 200, endpoint);
    assert.equal(response.headers["set-cookie"], undefined);
    results.push(response.body);
  }
  assert.deepEqual(results[0], [{ codigo: "21", nome: "Fiat" }]);
  assert.deepEqual(results[1].modelos, [{ codigo: "1", nome: "Argo" }]);
  assert.deepEqual(results[2], [{ codigo: "2024-1", nome: "2024 Gasolina" }]);
  assert.equal(results[3].Valor, price.price);
  assert.equal(results[3].CodigoFipe, price.codeFipe);
  assert.equal(deliveries.length, 4);
});

test("public FIPE does not unlock plate checkout, payment status or paid reports", async () => {
  const config = await request(app).get("/api/config");
  assert.equal(config.body.authAvailable, false);
  assert.equal(config.body.checkoutAvailable, false);
  assert.equal(config.body.priceCents, 5000);
  const id = "11111111-1111-4111-8111-111111111111";
  for (const endpoint of [
    "/api/checkout",
    `/api/vehicle/orders/${id}/report`,
  ]) {
    const response = await request(app)
      .post(endpoint)
      .set("Origin", env.publicAppUrl)
      .set("X-App-Request", "1")
      .send({ plate: "ABC1D23" });
    assert.equal(response.status, 401, endpoint);
  }
  assert.equal(
    (await request(app).get(`/api/checkout/status/${id}`)).status,
    401,
  );
});

test("invalid FIPE input never reaches the provider", async () => {
  const count = deliveries.length;
  for (const endpoint of [
    "/brands?tipo=invalid",
    "/models?brandCode=../private",
    "/vehicle?brandCode=21&modelCode=1&yearCode=invalid",
  ]) {
    assert.equal((await request(app).get("/api/fipe" + endpoint)).status, 400);
  }
  assert.equal(deliveries.length, count);
});

test("public rate limit works without secrets, rejects forwarded-IP spoofing and expires", async () => {
  const limited = express();
  let now = Date.now();
  const clock = mock.method(Date, "now", () => now);
  limited.get("/", publicRateLimit(2, 1), (_req, res) => {
    res.json({ ok: true });
  });
  try {
    assert.equal((await request(limited).get("/")).status, 200);
    assert.equal(
      (await request(limited).get("/").set("X-Forwarded-For", "198.51.100.1"))
        .status,
      200,
    );
    const blocked = await request(limited)
      .get("/")
      .set("X-Forwarded-For", "198.51.100.2");
    assert.equal(blocked.status, 429);
    assert.equal(blocked.headers["retry-after"], "1");
    now += 1001;
    assert.equal((await request(limited).get("/")).status, 200);
  } finally {
    clock.mock.restore();
  }
});
