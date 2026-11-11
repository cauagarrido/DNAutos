import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

for (const width of [320, 390, 768, 1440]) {
  test(`liquid glass layout remains usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: "Seu próximo carro. Sem pontos cegos.",
      }),
    ).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    const field = page.getByLabel("Digite a placa do veículo");
    await field.scrollIntoViewIfNeeded();
    const bounds = await field.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    expect(
      (await page
        .getByRole("button", { name: "Consultar veículo · R$ 50,00" })
        .boundingBox())!.height,
    ).toBeGreaterThanOrEqual(44);
    if (width < 940) {
      await page
        .getByRole("button", { name: "Abrir menu", exact: true })
        .click();
      await page
        .getByRole("navigation", { name: "Navegação no celular" })
        .getByRole("button", { name: "Como funciona" })
        .click();
      await expect(page.locator("#como-funciona")).toBeInViewport();
      await expect(
        page.getByRole("navigation", { name: "Navegação no celular" }),
      ).toHaveCount(0);
    } else {
      await page
        .getByRole("navigation", { name: "Navegação principal" })
        .getByRole("button", { name: "Como funciona" })
        .click();
      await expect(page.locator("#como-funciona")).toBeInViewport();
    }
    await page.getByText("Quanto custa uma consulta?", { exact: true }).click();
    await expect(page.locator("details").first()).toHaveAttribute("open", "");
    await field.fill("ABC1D23");
    await expect(page.locator(".query-submit")).toBeEnabled();
    expect(
      await field.evaluate((element: HTMLInputElement) => {
        const style = getComputedStyle(element);
        const context = document.createElement("canvas").getContext("2d")!;
        context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const textWidth =
          context.measureText(element.value).width +
          parseFloat(style.letterSpacing) * element.value.length;
        return (
          textWidth <=
          element.clientWidth -
            parseFloat(style.paddingLeft) -
            parseFloat(style.paddingRight)
        );
      }),
    ).toBe(true);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({
      path: `tmp/design-home-${width}.png`,
      fullPage: true,
      animations: "disabled",
    });
  });
}

test("search tabs work from the keyboard and reduced motion disables reactive lighting", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/fipe/brands*", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.goto("/");
  const plate = page.getByRole("tab", { name: "Pela placa" });
  await plate.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Tabela FIPE" })).toBeFocused();
  await expect(page.getByRole("tab", { name: "Tabela FIPE" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.keyboard.press("Home");
  await expect(plate).toBeFocused();
  await expect(plate).toHaveAttribute("aria-selected", "true");
  await page.locator(".query-panel").hover();
  expect(
    await page
      .locator(".query-panel")
      .evaluate((element) =>
        (element as HTMLElement).style.getPropertyValue("--glass-x"),
      ),
  ).toBe("");
  expect(
    await page
      .locator(".segmented-indicator")
      .evaluate((element) => getComputedStyle(element).transitionDuration),
  ).toBe("1e-05s");
});

test("homepage and authentication sheet pass automated WCAG checks", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const home = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    home.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => ({
        target: node.target,
        details: node.failureSummary,
      })),
    })),
  ).toEqual([]);
  await page.getByRole("button", { name: "Entrar / Criar conta" }).click();
  await expect(page.getByLabel("E-mail", { exact: true })).toBeFocused();
  const dialog = await new AxeBuilder({ page })
    .include('[role="dialog"]')
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    dialog.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => ({
        target: node.target,
        details: node.failureSummary,
      })),
    })),
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Entrar / Criar conta" }),
  ).toBeFocused();
});

test("mobile forms remain inside the screen and preserve readable input size", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar / Criar conta" }).click();
  const dialog = page.getByRole("dialog"),
    input = page.getByLabel("E-mail", { exact: true });
  const bounds = await dialog.boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(700);
  expect(
    await input.evaluate((element) =>
      parseFloat(getComputedStyle(element).fontSize),
    ),
  ).toBeGreaterThanOrEqual(16);
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await page
    .getByLabel("Confirmar senha", { exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByLabel("Confirmar senha", { exact: true }),
  ).toBeInViewport();
  await page.screenshot({
    path: "tmp/design-auth-mobile.png",
    animations: "disabled",
  });
});

test("FIPE selection reaches the report and returning allows another search", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const paidRequests: string[] = [];
  page.on("request", (request) => {
    if (/\/api\/(checkout|vehicle|account)\b/.test(request.url()))
      paidRequests.push(request.url());
  });
  let releaseConfig!: () => void;
  const configPending = new Promise<void>((resolve) => {
    releaseConfig = resolve;
  });
  await page.route("**/api/config", async (route) => {
    await configPending;
    await route.fulfill({
      json: {
        authAvailable: false,
        checkoutAvailable: false,
        priceCents: 5000,
      },
    });
  });
  await page.route("**/api/fipe/**", async (route) => {
    const endpoint = new URL(route.request().url()).pathname.split("/").pop();
    const responses = {
      brands: [{ codigo: "21", nome: "Fiat" }],
      models: { modelos: [{ codigo: 1, nome: "Argo" }], anos: [] },
      years: [{ codigo: "2024-1", nome: "2024 Gasolina" }],
      vehicle: {
        Valor: "R$ 70.000,00",
        Marca: "Fiat",
        Modelo: "Argo",
        AnoModelo: 2024,
        Combustivel: "Gasolina",
        CodigoFipe: "001000-1",
        MesReferencia: "novembro de 2026",
        TipoVeiculo: 1,
        SiglaCombustivel: "G",
      },
    };
    await route.fulfill({
      json: responses[endpoint as keyof typeof responses],
    });
  });
  try {
    await page.goto("/");
    await page.getByRole("tab", { name: "Tabela FIPE" }).click();
    await expect(page.locator(".query-price")).toContainText("Grátis");
    await expect(page.locator(".query-price")).toContainText("sem login");
    await expect(page.locator(".query-panel-footer")).not.toContainText(
      "Mercado Pago",
    );
    const consult = page.getByRole("button", { name: "Consultar valor FIPE" });
    await expect(consult).toBeDisabled();
    await page.getByLabel("Marca", { exact: true }).selectOption("21");
    await page.getByLabel("Modelo", { exact: true }).selectOption("1");
    await page
      .getByLabel("Ano / Combustível", { exact: true })
      .selectOption("2024-1");
    await expect(consult).toBeEnabled();
    await consult.click();
    await expect(page.getByText("Argo", { exact: true }).first()).toBeVisible();
    await expect(page.locator("#fipe-result-title")).toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.getByText(/70\.000/).first()).toBeVisible();
    await expect(
      page.getByText("TABELA FIPE · CONSULTA GRATUITA", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Histórico veicular", { exact: true }),
    ).toHaveCount(0);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(paidRequests).toEqual([]);
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      accessibility.violations.map((item) => ({
        id: item.id,
        nodes: item.nodes.map((node) => node.target),
      })),
    ).toEqual([]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
    await page.screenshot({
      path: "tmp/fipe-result-mobile.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "Voltar", exact: true }).click();
    await expect(page.getByLabel("Digite a placa do veículo")).toBeVisible();
  } finally {
    releaseConfig();
  }
});
