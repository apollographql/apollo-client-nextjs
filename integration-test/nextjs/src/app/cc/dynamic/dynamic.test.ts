import { expect } from "@playwright/test";
import { test } from "../../../../fixture";

test.describe("CC dynamic", () => {
  test.describe("useSuspenseQuery", () => {
    test("one query", async ({ page, blockRequest, hydrationFinished }) => {
      await page.goto("http://localhost:3000/cc/dynamic/useSuspenseQuery", {
        waitUntil: "commit",
      });

      await expect(page).toBeInitiallyLoading(false);
      await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();

      await hydrationFinished;
      await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
    });
  });
  test.describe("useBackgroundQuery + useReadQuery", () => {
    test("one query", async ({ page, blockRequest, hydrationFinished }) => {
      await page.goto("http://localhost:3000/cc/dynamic/useBackgroundQuery", {
        waitUntil: "commit",
      });

      await expect(page).toBeInitiallyLoading(true);
      await expect(page.getByText("loading")).not.toBeVisible();
      await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();

      await hydrationFinished;
      await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
    });

    // this will close the connection before the final result is received, so it can never be forwarded
    test("no `useReadQuery` on the server", async ({ page }) => {
      await page.goto(
        "http://localhost:3000/cc/dynamic/useBackgroundQueryWithoutSsrReadQuery",
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
  test.describe("useQuery", () => {
    test("without cache value", async ({ page }) => {
      await page.goto("http://localhost:3000/cc/dynamic/useQuery", {
        waitUntil: "commit",
      });

      await expect(page).toBeInitiallyLoading(true);
      await expect(page.getByText("loading")).not.toBeVisible();
      await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
    });

    test("with cache value", async ({ page }) => {
      await page.goto("http://localhost:3000/cc/dynamic/useQueryWithCache", {
        waitUntil: "commit",
      });

      await expect(page).toBeInitiallyLoading(false);
      await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
    });
  });
  test.describe("useSuspenseQuery with a nonce", () => {
    test("invalid: logs an error", async ({ page, blockRequest }) => {
      await page.goto(
        "http://localhost:3000/cc/dynamic/useSuspenseQuery?nonce=invalid",
        {
          waitUntil: "commit",
        }
      );

      const messagePromise = page.waitForEvent("console");
      const message = await messagePromise;
      expect(message.text()).toMatch(
        /^Refused to execute inline script because it violates the following Content Security Policy/
      );
    });
    test("valid: does not log an error", async ({ page, blockRequest }) => {
      await page.goto(
        "http://localhost:3000/cc/dynamic/useSuspenseQuery?nonce=8IBTHwOdqNKAWeKl7plt8g==",
        {
          waitUntil: "commit",
        }
      );

      const messagePromise = page.waitForEvent("console");
      expect(messagePromise).rejects.toThrow(/waiting for event \"console\"/);
    });
  });
});
