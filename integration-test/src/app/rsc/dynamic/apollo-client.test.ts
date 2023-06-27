import { expect } from "@playwright/test";
import { test } from "../../../../fixture";

test.describe("RSC dynamic", () => {
  test("useSuspenseQuery (one query)", async ({ page, blockRequest }) => {
    await page.goto("http://localhost:3000/rsc/dynamic/useSuspenseQuery");

    await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
  });
});
