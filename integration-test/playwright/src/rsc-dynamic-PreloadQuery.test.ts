import { expect } from "@playwright/test";
import { test } from "../fixture";

const reactErr419 = /(Minified React error #419|Switched to client rendering)/;

test.describe("PreloadQuery", () => {
  for (const [description, path] of [
    ["with useSuspenseQuery", "useSuspenseQuery"],
    ["with queryRef and useReadQuery", "queryRef-useReadQuery"],
  ] as const) {
    test.describe(description, () => {
      test("query resolves on the server", async ({ page, blockRequest }) => {
        await page.goto(
          `/rsc/dynamic/PreloadQuery/${path}?errorIn=ssr,browser`,
          {
            waitUntil: "commit",
          }
        );

        await expect(page).toBeInitiallyLoading(true);
        await expect(page.getByText("loading")).not.toBeVisible();
        await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
        await expect(
          page.getByText("Queried in RSC environment")
        ).toBeVisible();
      });

      test("link chain errors on the server, restarts in the browser", async ({
        page,
      }) => {
        page.allowErrors?.();
        await page.goto(
          `/rsc/dynamic/PreloadQuery/${path}?errorIn=rsc,network_error`,
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
      });

      if (path === "queryRef-useReadQuery") {
        // this only works for `useReadQuery`, because `useSuspenseQuery` won't attach
        // to the exact same suspenseCache entry and as a result, it won't get the
        // error message from the ReadableStream.
        test("graphqlError on the server, transported to the browser, can be restarted", async ({
          page,
        }) => {
          page.allowErrors?.();
          await page.goto(`/rsc/dynamic/PreloadQuery/${path}?errorIn=rsc`, {
            waitUntil: "commit",
          });

          await expect(page).toBeInitiallyLoading(true);

          await expect(page.getByText("loading")).not.toBeVisible();

          await expect(page.getByText("Encountered an error:")).toBeVisible();
          await expect(page.getByText("Simulated error")).toBeVisible();

          page.getByRole("button", { name: "Try again" }).click();

          await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
          await expect(
            page.getByText("Queried in Browser environment")
          ).toBeVisible();
        });
      } else {
        // instead, `useSuspenseQuery` will behave as if nothing had been transported
        // and rerun the query in the browser.
        // there is a chance it will also rerun the query during SSR, that's a timing
        // question that might need further investigation
        // the bottom line: `PreloadQuery` with `useSuspenseQuery` works in the happy
        // path, but it's not as robust as `queryRef` with `useReadQuery`.
        test("graphqlError on the server, restarts in the browser", async ({
          page,
        }) => {
          page.allowErrors?.();
          await page.goto(`/rsc/dynamic/PreloadQuery/${path}?errorIn=rsc`, {
            waitUntil: "commit",
          });

          await expect(page).toBeInitiallyLoading(true);

          await page.waitForEvent("pageerror", (error) => {
            return reactErr419.test(error.message);
          });

          await expect(page.getByText("loading")).not.toBeVisible();
          await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
          await expect(
            page.getByText("Queried in Browser environment")
          ).toBeVisible();
        });
      }
    });
  }

  test("queryRef works with useQueryRefHandlers", async ({ page }) => {
    await page.goto(`/rsc/dynamic/PreloadQuery/queryRef-useReadQuery`, {
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
  });

  test.skip("queryRef: assumptions about referential equality", async ({
    page,
  }) => {
    await page.goto(`/rsc/dynamic/PreloadQuery/queryRef-refTest`, {
      waitUntil: "commit",
    });

    await page.getByRole("spinbutton").nth(11).waitFor();

    for (let i = 0; i < 12; i++) {
      await expect(page.getByRole("spinbutton").nth(i)).toHaveClass("valid");
    }
  });
});
