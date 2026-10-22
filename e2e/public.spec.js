import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("catálogo, WhatsApp y canonical", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/catalogo");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("article")).toHaveCount(12);
  await expect(page.getByRole("button", { name: "Ver más unidades" })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    page.url().split("?")[0],
  );
  await expect(
    page.locator('a[href*="wa.me/56973236636"]').filter({ visible: true }).first(),
  ).toBeVisible();
  const axe = await new AxeBuilder({ page }).analyze();
  const serious = axe.violations.filter((item) => item.impact === "serious" || item.impact === "critical");
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});

test("ficha, OG y schema", async ({ page, request }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/catalogo");
  await page.locator("article a").first().click();
  await expect(page).toHaveURL(/\/catalogo\/.+/);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/catalogo\/.+/);
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(canonical).toBe(page.url());
  const title = await page.title();
  const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
  const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
  const description = await page.locator('meta[name="description"]').getAttribute("content");
  expect(ogTitle).toMatch(/20\d\d/);
  expect(ogTitle).toMatch(/\$|pendiente/i);
  expect(description).toMatch(/\$200\.000/);
  expect(description).toMatch(/prueba de manejo/i);
  expect(ogImage).toMatch(/^https?:\/\//);
  expect(title.toLowerCase()).not.toMatch(/\b[a-z]{4}\d{2}\b/);
  const raw = await page.locator("#uc-jsonld").textContent();
  const data = JSON.parse(raw || "{}");
  const types = data["@graph"].map((node) => node["@type"]);
  expect(types).toEqual(expect.arrayContaining(["Car", "AutoDealer", "BreadcrumbList", "WebSite"]));
  const car = data["@graph"].find((node) => node["@type"] === "Car");
  expect(car.offers.priceCurrency).toBe("CLP");
  expect(car.offers.price).toBeGreaterThan(0);
  expect(car.offers.availability).toContain("schema.org");
  expect(car.vehicleCondition).toContain("UsedCondition");
  expect(car.modelDate).toMatch(/^20/);
  expect(car.brand.name).toBeTruthy();
  expect(car.image).toMatch(/^https?:\/\//);
  expect(car.mileageFromOdometer.value).toBeGreaterThan(0);
  expect(car.mileageFromOdometer.unitCode).toBe("KMT");
  const blob = JSON.stringify(data) + title + description + (await page.locator("h1").innerText());
  expect(blob.toLowerCase()).not.toMatch(/\b[a-z]{4}\d{2}\b/);
  if (ogImage.includes("/api/og-image")) {
    const image = await request.get(ogImage);
    expect(image.status()).toBe(200);
    expect(image.headers()["content-type"]).toContain("image/jpeg");
    expect((await image.body()).length).toBeLessThan(300 * 1024);
  } else {
    const image = await request.get(ogImage);
    expect(image.ok()).toBeTruthy();
    expect(image.headers()["content-type"]).toMatch(/image\/jpeg/);
    expect(Number(image.headers()["content-length"] || (await image.body()).length)).toBeLessThan(300 * 1024);
  }
  const axe = await new AxeBuilder({ page }).analyze();
  const serious = axe.violations.filter((item) => item.impact === "serious" || item.impact === "critical");
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});

test("el botón Consigna del inicio tapa la foto", async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const button = page.locator("section").first().getByRole("link", { name: "Consigna tu vehículo" });
    await expect(button).toBeVisible();
    const paint = await button.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        backdropFilter: style.backdropFilter,
        color: style.color,
        borderTopWidth: style.borderTopWidth,
        borderRadius: style.borderRadius,
      };
    });
    expect(paint.backgroundColor).toBe("rgb(0, 0, 0)");
    expect(paint.backgroundImage).toBe("none");
    expect(paint.backdropFilter === "none" || paint.backdropFilter === "").toBeTruthy();
    expect(paint.color).toBe("rgb(255, 255, 255)");
    expect(paint.borderTopWidth).toBe("1px");
    expect(Number.parseFloat(paint.borderRadius)).toBeGreaterThan(20);
    await button.hover();
    const hovered = await button.evaluate((el) => {
      const style = getComputedStyle(el);
      return { backgroundColor: style.backgroundColor, color: style.color };
    });
    expect(hovered.backgroundColor).toBe("rgb(0, 0, 0)");
    expect(hovered.color).toBe("rgb(255, 255, 255)");
  }
});

test("un auto que ya no está en esta planilla no redirige a otro sitio", async ({ request }) => {
  const moved = await request.get("/catalogo/ford-ranger-4x4-2023-shyl53", { maxRedirects: 0 });
  expect([200, 301, 410]).toContain(moved.status());
  const location = moved.headers().location || "";
  expect(location).not.toMatch(/rgmotorschile\.cl|salgadoautomotriz\.cl/);
  if (moved.status() === 301) {
    const target = new URL(location, "http://127.0.0.1:4173");
    expect(target.hostname).toMatch(/^(127\.0\.0\.1|localhost|unidadeschile\.cl|www\.unidadeschile\.cl)$/);
    expect(target.pathname).toMatch(/^\/catalogo\//);
  }
  const maxus = await request.get("/catalogo/maxus-t60-4x2-at-2023-stpz87", { maxRedirects: 0 });
  expect([200, 301, 410]).toContain(maxus.status());
  expect(maxus.headers().location || "").not.toMatch(/rgmotorschile\.cl|salgadoautomotriz\.cl/);
  const shared = await request.get("/catalogo/mg-3-hatch-back-2022-rygb56", { maxRedirects: 0 });
  expect([200, 301, 410]).toContain(shared.status());
  expect(shared.headers().location || "").not.toMatch(/rgmotorschile\.cl|salgadoautomotriz\.cl/);
  const xml = await request.get("/sitemap.xml");
  expect(xml.ok()).toBeTruthy();
  const text = await xml.text();
  expect(text).not.toMatch(/rgmotorschile\.cl|salgadoautomotriz\.cl/);
  expect(text).toContain("<lastmod>");
  const locs = [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  expect(locs.length).toBeGreaterThan(10);
  expect(new Set(locs).size).toBe(locs.length);
  expect(locs.filter((loc) => loc.endsWith("/catalogo")).length).toBe(1);
  expect(locs.every((loc) => loc.startsWith("https://www.unidadeschile.cl") || loc.startsWith("http://127.0.0.1"))).toBeTruthy();
});
