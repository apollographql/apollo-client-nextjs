import { expect } from "@playwright/test";
import { test } from "../fixture";

test.describe(
  "RSC dynamic",
  {
    tag: ["@nextjs"],
  },
  () => {
    test("query (one query)", async ({ page, blockRequest }) => {
      await page.goto("/rsc/dynamic/query", {
        waitUntil: "commit",
      });

      await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
    });
  }
);
