import { expect } from "@playwright/test";
import { test } from "../../../../fixture";

test.describe("CC static", () => {
  test("useSuspenseQuery (one query)", async ({ page, blockRequest }) => {
    page.goto("http://localhost:3000/cc/static/useSuspenseQuery");

    await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
  });
});
