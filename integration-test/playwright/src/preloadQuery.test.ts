import { expect } from "@playwright/test";
import { test } from "../fixture";
import { matchesTag } from "./helpers";

const reactErr419 = /(Minified React error #419|Switched to client rendering)/;

const base = matchesTag("@nextjs")
  ? "/rsc/dynamic/PreloadQuery"
  : "/preloadQuery";

const originatesIn = matchesTag("@nextjs") ? "RSC" : "SSR";
const otherEnvs = matchesTag("@nextjs") ? "ssr,browser" : "browser";

test.describe("PreloadQuery", () => {
  for (const [description, path] of [
    ["with useSuspenseQuery", "useSuspenseQuery"],
    ["with queryRef and useReadQuery", "queryRef-useReadQuery"],
  ] as const) {
    test.describe(description, () => {
      test(
        "query resolves on the server",
        {
          tag: ["@nextjs", "@tanstack"],
        },
        async ({ page, blockRequest }) => {
          await page.goto(`${base}/${path}?errorIn=${otherEnvs}`, {
            waitUntil: "commit",
          });

          await expect(page).toBeInitiallyLoading(true);
          await expect(page.getByText("loading")).not.toBeVisible();
          await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
          await expect(
            page.getByText(`Queried in ${originatesIn} environment`)
          ).toBeVisible();
        }
      );

      test(
        "link chain errors on the server, restarts in the browser",
        {
          tag: ["@nextjs", "@tanstack"],
        },
        async ({ page }) => {
          page.allowErrors?.();
          await page.goto(
            `${base}/${path}?errorIn=${originatesIn.toLowerCase()},network_error`,
            {
              waitUntil: "commit",
            }
          );

          await expect(page).toBeInitiallyLoading(true);

          await page.waitForEvent("pageerror", (error) => {
            return reactErr419.test(error.message);
          });

          await expect(page.getByText("loading")).not.toBeVisible();
          await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
          await expect(
            page.getByText("Queried in Browser environment")
          ).toBeVisible();
        }
      );

      if (path === "queryRef-useReadQuery") {
        // this only works for `useReadQuery`, because `useSuspenseQuery` won't attach
        // to the exact same suspenseCache entry and as a result, it won't get the
        // error message from the ReadableStream.
        test(
          "graphqlError on the server, transported to the browser, can be restarted",
          {
            tag: [
              "@nextjs",
              // TODO:  "@tanstack" causes a non-recoverable hydration mismatch
            ],
          },
          async ({ page }) => {
            page.allowErrors?.();
            await page.goto(
              `${base}/${path}?errorIn=${originatesIn.toLowerCase()}`,
              {
                waitUntil: "commit",
              }
            );

            await expect(page).toBeInitiallyLoading(true);

            await expect(page.getByText("loading")).not.toBeVisible();

            await expect(page.getByText("Encountered an error:")).toBeVisible();
            await expect(page.getByText("Simulated error")).toBeVisible();

            page.getByRole("button", { name: "Try again" }).click();

            await expect(
              page.getByText("Soft Warm Apollo Beanie")
            ).toBeVisible();
            await expect(
              page.getByText("Queried in Browser environment")
            ).toBeVisible();
          }
        );
      } else {
        // instead, `useSuspenseQuery` will behave as if nothing had been transported
        // and rerun the query in the browser.
        // there is a chance it will also rerun the query during SSR, that's a timing
        // question that might need further investigation
        // the bottom line: `PreloadQuery` with `useSuspenseQuery` works in the happy
        // path, but it's not as robust as `queryRef` with `useReadQuery`.
        test(
          "graphqlError on the server, restarts in the browser",
          {
            tag: ["@nextjs", "@tanstack"],
          },
          async ({ page }) => {
            page.allowErrors?.();
            await page.goto(
              `${base}/${path}?errorIn=${originatesIn.toLowerCase()}`,
              {
                waitUntil: "commit",
              }
            );

            await expect(page).toBeInitiallyLoading(true);

            await page.waitForEvent("pageerror", (error) => {
              return reactErr419.test(error.message);
            });

            await expect(page.getByText("loading")).not.toBeVisible();
            await expect(
              page.getByText("Soft Warm Apollo Beanie")
            ).toBeVisible();
            await expect(
              page.getByText("Queried in Browser environment")
            ).toBeVisible();
          }
        );
      }
    });
  }

  test(
    "queryRef works with useQueryRefHandlers",
    {
      tag: ["@nextjs"],
    },
    async ({ page }) => {
      await page.goto(`${base}/queryRef-useReadQuery`, {
        waitUntil: "commit",
      });

      await expect(page).toBeInitiallyLoading(true);
      await expect(page.getByText("loading")).not.toBeVisible();
      await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
      await expect(page.getByText("Queried in RSC environment")).toBeVisible();

      await page.getByRole("button", { name: "refetch" }).click();
      await expect(
        page.getByText("Queried in Browser environment")
      ).toBeVisible();
    }
  );
});
