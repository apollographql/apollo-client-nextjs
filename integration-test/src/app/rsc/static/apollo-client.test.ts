import { expect } from "@playwright/test";
import { test } from "../../../../fixture";

test.describe("RSC static", () => {
  test("useSuspenseQuery (one query)", async ({ page, blockRequest }) => {
    page.goto("http://localhost:3000/rsc/static/useSuspenseQuery");

    await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
  });
});
