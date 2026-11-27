import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const publishedTitles = [
  "Application React de gestion de flotte",
  "API REST de facturation",
  "Tableau de bord de qualité des données",
  "Assistant conversationnel interne",
];

const expectedTitle = "API REST de facturation";
const missingTitle = "zzzz-inexistant-742";

const signInAndOpenOffers = async (page: Page) => {
  // La fixture page de Playwright fournit un contexte neuf pour chaque test.
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Connexion de démonstration" })).toBeVisible();
  await page.getByRole("button", { name: "Dmytro Kovalenko", exact: true }).click();
  await expect(page.getByText("Dmytro Kovalenko", { exact: true })).toBeVisible();
  await expect(page.getByText("Étudiant", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Offres", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Offres de stage" })).toBeVisible();

  const main = page.getByRole("main");
  const period = main.getByRole("combobox", { name: "Période", exact: true });
  const search = main.getByRole("searchbox", { name: "Rechercher par titre", exact: true });
  await expect(period).toHaveValue("");
  await expect(search).toHaveValue("");

  // Vérifier les témoins avant la recherche empêche notamment un faux succès
  // du scénario vide sur une base mal préparée ou une liste jamais chargée.
  const table = main.getByRole("table");
  await expect(table.locator("tbody").getByRole("row")).toHaveCount(publishedTitles.length);
  for (const title of publishedTitles) {
    await expect(table.getByRole("cell", { name: title, exact: true })).toBeVisible();
  }
  await expect(main.getByRole("alert")).toHaveCount(0);
  return { main, period, search };
};

const isOffersResponse = (url: string, title: string) => {
  const parsed = new URL(url);
  return parsed.pathname === "/api/offers"
    && parsed.searchParams.get("period") === "P2"
    && (parsed.searchParams.get("title") ?? "") === title;
};

const searchInP2 = async (page: Page, title: string) => {
  const { main, period, search } = await signInAndOpenOffers(page);
  const [periodResponse] = await Promise.all([
    page.waitForResponse((response) => response.request().method() === "GET"
      && isOffersResponse(response.url(), "")),
    period.selectOption("P2"),
  ]);
  expect(periodResponse.status(), "Chargement des offres de P2").toBe(200);

  const [searchResponse] = await Promise.all([
    page.waitForResponse((response) => response.request().method() === "GET"
      && isOffersResponse(response.url(), title)),
    search.fill(title),
  ]);
  expect(searchResponse.status(), "Recherche réelle avec titre et période").toBe(200);
  await expect(period).toHaveValue("P2");
  await expect(search).toHaveValue(title);
  return main;
};

test("Scénario 1 — recherche API en P2 affiche uniquement l'offre attendue", async ({ page }) => {
  const main = await searchInP2(page, "API");
  await expect(main.getByText("1 offre", { exact: true })).toBeVisible();

  const table = main.getByRole("table");
  const rows = table.locator("tbody").getByRole("row");
  await expect(rows).toHaveCount(1);
  const offerRow = rows.filter({ has: page.getByRole("cell", { name: expectedTitle, exact: true }) });
  await expect(offerRow).toHaveCount(1);
  const cells = offerRow.getByRole("cell");
  await expect(cells.nth(0)).toHaveText(expectedTitle);
  await expect(cells.nth(1)).toHaveText("Orbis");
  await expect(cells.nth(2)).toHaveText("2026-2027");
  await expect(cells.nth(3)).toHaveText("P2");
  await expect(cells.nth(4)).toHaveText("Publiée");
  for (const title of publishedTitles.filter((title) => title !== expectedTitle)) {
    await expect(main.getByText(title, { exact: true })).toHaveCount(0);
  }
  await expect(main.getByRole("status")).toHaveCount(0);
  await expect(main.getByRole("alert")).toHaveCount(0);
  await expect(main.getByText("Aucune offre à afficher.", { exact: true })).toHaveCount(0);
  await expect(main.getByText("Aucune offre ne correspond à la recherche.", { exact: true })).toHaveCount(0);
});

test("Scénario 2 — une recherche sans correspondance affiche l'état vide", async ({ page }) => {
  const main = await searchInP2(page, missingTitle);
  await expect(main.getByText("Aucune offre ne correspond à la recherche.", { exact: true })).toBeVisible();
  await expect(main.getByRole("table")).toHaveCount(0);
  for (const title of publishedTitles) {
    await expect(main.getByText(title, { exact: true })).toHaveCount(0);
  }
  await expect(main.getByRole("status")).toHaveCount(0);
  await expect(main.getByRole("alert")).toHaveCount(0);
  await expect(main.getByText("Aucune offre à afficher.", { exact: true })).toHaveCount(0);
});
