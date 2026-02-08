import { expect, test } from "@playwright/test";

test("landing renders primary headline", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Construyo productos digitales");
});
