import { expect } from "@playwright/test";
import { test } from "../../../../fixture";

test.describe("RSC static", () => {
  test("useSuspenseQuery (one query)", async ({ page, blockRequest }) => {
    await page.goto("http://localhost:3000/rsc/static/useSuspenseQuery", {
      waitUntil: "commit",
    });

    await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
  });
});
