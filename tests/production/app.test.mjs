import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
let processHandle, origin;
before(async () => {
  const reservation = createServer();
  reservation.listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  origin = `http://127.0.0.1:${port}`;
  processHandle = spawn(process.execPath, ["backend/dist/server.js"], {
    cwd: root,
    windowsHide: true,
    stdio: "ignore",
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(port),
      SERVE_FRONTEND: "true",
      PUBLIC_APP_URL: origin,
      PUBLIC_API_URL: origin,
      CHECKOUT_ENABLED: "false",
    },
  });
  for (let i = 0; i < 80; i++) {
    if (processHandle.exitCode !== null)
      throw new Error("Production process exited before startup");
    try {
      const response = await fetch(origin + "/api/health");
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Production process failed to start");
});
after(async () => {
  if (processHandle && processHandle.exitCode === null) {
    const stopped = once(processHandle, "exit");
    processHandle.kill();
    await stopped;
  }
});
test("same process serves frontend entry point, all emitted assets and SPA deep links", async () => {
  const page = await fetch(origin),
    html = await page.text();
  assert.equal(page.status, 200);
  assert.match(html, /id="root"/);
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map(
    (match) => match[1],
  );
  assert.ok(assets.length >= 2);
  for (const asset of assets) {
    const response = await fetch(origin + asset);
    assert.equal(response.status, 200, asset);
    if (asset.endsWith(".js")) {
      const bundle = await response.text();
      for (const secret of [
        "SESSION_ENCRYPTION_KEY",
        "MERCADO_PAGO_ACCESS_TOKEN",
        "SUPABASE_PUBLISHABLE_KEY",
        "DATABASE_URL",
      ])
        assert.ok(
          !bundle.includes(secret),
          secret + " leaked to the frontend bundle",
        );
    }
  }
  assert.equal((await fetch(origin + "/historico/compras")).status, 200);
  for (const asset of [
    "/dnautos-logo.png",
    "/dnautos-hero-light.png",
    "/favicon.svg",
  ])
    assert.equal((await fetch(origin + asset)).status, 200, asset);
});
test("API routes preserve JSON responses and unknown API paths do not return the SPA", async () => {
  const health = await fetch(origin + "/api/health");
  assert.equal((await health.json()).status, "OK");
  const missing = await fetch(origin + "/api/not-a-route");
  assert.equal(missing.status, 404);
  assert.match(missing.headers.get("content-type"), /application\/json/);
  const config = await (await fetch(origin + "/api/config")).json();
  assert.equal(config.priceCents, 5000);
  assert.equal(config.checkoutAvailable, false);
});
test("production headers prevent caching sensitive APIs, framing and content sniffing", async () => {
  const response = await fetch(origin + "/api/health");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.match(
    response.headers.get("content-security-policy"),
    /frame-ancestors 'none'/,
  );
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(response.headers.get("x-powered-by"), null);
});
test("source, environment files and deployment files are never served as static downloads", async () => {
  for (const file of [
    "/backend/.env",
    "/frontend/.env",
    "/.env",
    "/backend/src/app.ts",
    "/Dockerfile",
    "/package.json",
    "/private-docs/README.md",
    "/private-docs/docs/GUIA_INTEGRACAO_DEPLOY.md",
    "/private-docs/output/pdf/guia-integracao-deploy-dnautos.pdf",
    "/docs/GUIA_INTEGRACAO_DEPLOY.md",
    "/ANYCAR_SETUP.md",
  ]) {
    const response = await fetch(origin + file),
      body = await response.text();
    assert.ok(response.status === 404 || body.includes('id="root"'), file);
    assert.ok(!body.includes("SESSION_ENCRYPTION_KEY="), file);
    assert.ok(!body.includes("FROM node:"), file);
    assert.ok(!body.startsWith("%PDF-"), file);
    assert.ok(!body.includes("GUIA DE IMPLANTAÇÃO"), file);
  }
});
