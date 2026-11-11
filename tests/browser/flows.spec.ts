import { test, expect } from "@playwright/test";
test("unconfigured services fail closed and show honest customer messages", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByText("Consultas por placa em preparação.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Entrar / Criar conta" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page.getByLabel("E-mail", { exact: true })).toBeVisible();
  await expect(
    page.getByLabel("Confirmar senha", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Nome completo", { exact: true })).toHaveCount(
    0,
  );
  await page.getByLabel("E-mail", { exact: true }).fill("teste@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("senha-valida-123");
  await page
    .getByLabel("Confirmar senha", { exact: true })
    .fill("senha-valida-123");
  await page
    .getByRole("button", { name: "Cadastrar e confirmar e-mail" })
    .click();
  await expect(page.getByRole("alert")).toContainText("não configurado");
  await page.screenshot({
    path: "tmp/browser-unconfigured.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("simulated verified session shows fixed price and owned purchase actions", async ({
  page,
}) => {
  const id = "11111111-1111-4111-8111-111111111111";
  await page.route("**/api/config", (route) =>
    route.fulfill({
      json: {
        authAvailable: true,
        checkoutAvailable: true,
        priceCents: 5000,
        supportUrl: "https://example.com/support",
        requirePhoneMfa: true,
      },
    }),
  );
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({
      json: {
        user: {
          id,
          email: "cliente@example.com",
          name: "cliente",
          createdAt: new Date().toISOString(),
        },
        mfaRequired: false,
        needsEnrollment: false,
        recovery: false,
      },
    }),
  );
  await page.route("**/api/auth/activity", (route) =>
    route.fulfill({ json: { ok: true } }),
  );
  await page.route("**/api/auth/reports", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route("**/api/account/orders*", (route) =>
    route.fulfill({
      json: {
        orders: [
          {
            id,
            plate: "ABC1D23",
            amountCents: 5000,
            status: "approved",
            reportState: "available",
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 1800000).toISOString(),
            checkoutUrl: null,
            refundRequested: false,
          },
        ],
        nextOffset: null,
      },
    }),
  );
  await page.goto("/");
  await page.getByLabel("Digite a placa do veículo").fill("ABC1D23");
  await page
    .getByRole("button", { name: "Consultar veículo · R$ 50,00" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("R$ 50,00");
  await expect(
    page.getByRole("button", { name: "Pagar R$ 50,00 no Mercado Pago" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.getByRole("button", { name: /Olá, cliente/ }).click();
  await page.getByRole("button", { name: /Minhas consultas/ }).click();
  await expect(
    page.getByRole("button", { name: "Realizar consulta paga" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ajuda / solicitar estorno" }).click();
  await expect(page.getByLabel("Motivo", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Contato direto com o suporte" }),
  ).toBeVisible();
  await page.screenshot({ path: "tmp/browser-history.png", fullPage: true });
});
