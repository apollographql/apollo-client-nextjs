import { expect } from "@playwright/test";
import { test } from "../../../../../fixture";

test.describe("PreloadQuery", () => {
  for (const [decription, path] of [
    ["with useSuspenseQuery", "useSuspenseQuery"],
    ["with queryRef and useReadQuery", "queryRef-useReadQuery"],
  ] as const) {
    test.describe(decription, () => {
      test("query resolves on the server", async ({ page, blockRequest }) => {
        await page.goto(
          `http://localhost:3000/rsc/dynamic/PreloadQuery/${path}?errorIn=ssr,browser`,
          {
            waitUntil: "commit",
          }
        );

        await expect(page).toBeInitiallyLoading(true);
        await expect(page.getByText("loading")).not.toBeVisible();
        await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
      });

      test("query errors on the server, restarts in the browser", async ({
        page,
      }) => {
        page.allowErrors?.();
        await page.goto(
          `http://localhost:3000/rsc/dynamic/PreloadQuery/${path}?errorIn=rsc`,
          {
            waitUntil: "commit",
          }
        );

        await expect(page).toBeInitiallyLoading(true);

        await page.waitForEvent("pageerror", (error) => {
          return (
            /* prod */ error.message.includes("Minified React error #419") ||
            /* dev */ error.message.includes("Query failed upstream.")
          );
        });

        await expect(page.getByText("loading")).not.toBeVisible();
        await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
      });
    });
  }
});
