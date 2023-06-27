import { expect } from "@playwright/test";
import { test } from "../../../../fixture";

test.describe("CC dynamic", () => {
  test("useSuspenseQuery (one query)", async ({ page, blockRequest }) => {
    const naviagtion = page.goto(
      "http://localhost:3000/cc/dynamic/useSuspenseQuery"
    );

    await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();

    await naviagtion;
  });

  test("useBackgroundQuery (one query)", async ({ page, blockRequest }) => {
    const naviagtion = page.goto(
      "http://localhost:3000/cc/dynamic/useBackgroundQuery"
    );

    await expect(page.getByText("loading")).toBeVisible();
    await expect(page.getByText("loading")).not.toBeVisible();
    await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();

    await naviagtion;
  });
});
