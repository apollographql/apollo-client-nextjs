import { expect } from "@playwright/test";
import { test } from "../../../../fixture";

test.describe("CC static", () => {
  test.describe("useSuspenseQuery", () => {
    test("one query", async ({ page, blockRequest, hydrationFinished }) => {
      await page.goto("http://localhost:3000/cc/static/useSuspenseQuery", {
        waitUntil: "commit",
      });

      await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
      await hydrationFinished;
      await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
    });
  });

  test.describe("useBackgroundQuery", () => {
    // this will close the connection before the final result is received, so it can never be forwarded
    test("no `useReadQuery` on the server", async ({ page }) => {
      await page.goto(
        "http://localhost:3000/cc/static/useBackgroundQueryWithoutSsrReadQuery",
        {
          waitUntil: "commit",
        }
      );

      await expect(page.getByText("rendered on server")).toBeVisible();
      await expect(page.getByText("rendered on client")).toBeVisible();
      await expect(page.getByText("loading")).toBeVisible();
      await expect(page.getByText("loading")).not.toBeVisible();
      await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
    });
  });
});
