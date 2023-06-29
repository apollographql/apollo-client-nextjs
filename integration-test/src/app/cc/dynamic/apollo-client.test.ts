import { expect } from "@playwright/test";
import { test } from "../../../../fixture";

test.describe("CC dynamic", () => {
  test("useSuspenseQuery (one query)", async ({ page, blockRequest }) => {
    await page.goto("http://localhost:3000/cc/dynamic/useSuspenseQuery", {
      waitUntil: "commit",
    });

    await expect(page).toBeInitiallyLoading(false);
    await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
  });

  test("useBackgroundQuery (one query)", async ({ page, blockRequest }) => {
    await page.goto("http://localhost:3000/cc/dynamic/useBackgroundQuery", {
      waitUntil: "commit",
    });

    await expect(page).toBeInitiallyLoading(true);
    await expect(page.getByText("loading")).not.toBeVisible();
    await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
  });

  test("useQuery", async ({ page }) => {
    await page.goto("http://localhost:3000/cc/dynamic/useQuery", {
      waitUntil: "commit",
    });

    await expect(page).toBeInitiallyLoading(true);
    await expect(page.getByText("loading")).not.toBeVisible();
    await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
  });

  test("useQuery (with cache value)", async ({ page }) => {
    await page.goto("http://localhost:3000/cc/dynamic/useQueryWithCache", {
      waitUntil: "commit",
    });

    await expect(page).toBeInitiallyLoading(false);
    await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
  });
});
