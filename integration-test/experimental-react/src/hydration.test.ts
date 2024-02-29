import { expect, test } from "@playwright/test";

test("page streams in", async ({ page }) => {
  await page.goto("http://localhost:3000/", {
    waitUntil: "commit",
  });
  await expect(page.getByText("Loading...")).toBeVisible();
  await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
  await expect(page.getByText("Loading...")).not.toBeVisible();
});

test("page gets interactive", async ({ page }) => {
  await page.goto("http://localhost:3000/", {
    waitUntil: "commit",
  });
  await expect(page.getByTestId("counter")).toHaveText("0");
  await page.getByText("increment").click();
  await expect(page.getByTestId("counter")).toHaveText("1");
});
