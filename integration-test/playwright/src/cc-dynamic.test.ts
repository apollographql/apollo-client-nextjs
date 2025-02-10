import { expect } from "@playwright/test";
import { test } from "../fixture";

const regex_connection_closed_early =
  /streaming connection closed before server query could be fully transported, rerunning/i;
const regex_query_error_restart =
  /query failed on server, rerunning in browser/i;
const reactErr419 = /(Minified React error #419|Switched to client rendering)/;

test.describe("CC dynamic", () => {
  test.describe("useSuspenseQuery", () => {
    test("one query", async ({ page, blockRequest, hydrationFinished }) => {
      await page.goto("/cc/dynamic/useSuspenseQuery", {
        waitUntil: "commit",
      });

      await expect(page).toBeInitiallyLoading(false);
      await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();

      await hydrationFinished;
      await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
    });

    test("error during SSR restarts query in browser", async ({
      page,
      hydrationFinished,
    }) => {
      page.allowErrors?.();
      let allLogs: string[] = [];
      page.on("console", (message) => {
        allLogs.push(message.text());
      });

      await page.goto("/cc/dynamic/useSuspenseQueryWithError", {
        waitUntil: "commit",
      });

      await expect(page).toBeInitiallyLoading(true);

      await page.waitForEvent("console", (message) => {
        return regex_query_error_restart.test(message.text());
      });
      await page.waitForEvent("pageerror", (error) => {
        return reactErr419.test(error.message);
      });

      await hydrationFinished;
      await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();

      for (const log of allLogs) {
        expect(log).not.toMatch(regex_connection_closed_early);
      }
    });
  });

  test.describe("useBackgroundQuery + useReadQuery", () => {
    test("one query", async ({ page, blockRequest, hydrationFinished }) => {
      await page.goto("/cc/dynamic/useBackgroundQuery", {
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
      await page.goto("/cc/dynamic/useBackgroundQueryWithoutSsrReadQuery", {
        waitUntil: "commit",
      });

      await expect(page.getByText("rendered on server")).toBeVisible();

      await page.waitForEvent("console", (message) => {
        return regex_connection_closed_early.test(message.text());
      });

      await expect(page.getByText("rendered on client")).toBeVisible();
      await expect(page.getByText("loading")).toBeVisible();
      await expect(page.getByText("loading")).not.toBeVisible();
      await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
    });
  });
  test.describe("useQuery", () => {
    test("without cache value", async ({ page }) => {
      await page.goto("/cc/dynamic/useQuery", {
        waitUntil: "commit",
      });

      await expect(page).toBeInitiallyLoading(true);
      await expect(page.getByText("loading")).not.toBeVisible();
      await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
    });

    test("with cache value", async ({ page }) => {
      await page.goto("/cc/dynamic/useQueryWithCache", {
        waitUntil: "commit",
      });

      await expect(page).toBeInitiallyLoading(false);
      await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
    });
  });
  test.describe("useSuspenseQuery with a nonce", () => {
    test("invalid: logs an error", async ({ page, blockRequest }) => {
      await page.goto("/cc/dynamic/useSuspenseQuery?nonce=invalid", {
        waitUntil: "commit",
      });

      await page.waitForEvent("console", (message) => {
        return /^Refused to execute inline script because it violates the following Content Security Policy/.test(
          message.text()
        );
      });
    });
    test("valid: does not log an error", async ({ page, blockRequest }) => {
      await page.goto(
        "/cc/dynamic/useSuspenseQuery?nonce=8IBTHwOdqNKAWeKl7plt8g==",
        {
          waitUntil: "commit",
        }
      );

      const messagePromise = page.waitForEvent("console");
      expect(messagePromise).rejects.toThrow(/waiting for event \"console\"/);
    });
  });
});
