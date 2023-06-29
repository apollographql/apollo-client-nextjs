import { test as base, expect } from "@playwright/test";

declare global {
  namespace PlaywrightTest {
    interface Matchers<R, T> {
      toBeInitiallyLoading(expectedState: boolean): R;
    }
  }
}

expect.extend({
  async toBeInitiallyLoading(
    received: import("@playwright/test").Page,
    expectedState: boolean
  ) {
    const pass =
      (await received.getByText("loading").isVisible()) == expectedState;
    if (pass) {
      return {
        message: () => "passed",
        pass: true,
      };
    } else {
      return {
        message: () => "failed",
        pass: false,
      };
    }
  },
});

export const test = base.extend<{
  withHar: import("@playwright/test").Page;
  blockRequest: import("@playwright/test").Page;
}>({
  page: async ({ page }, use) => {
    page.on("pageerror", (error) => {
      expect(error.stack || error).toBe("no error");
    });
    page.route("**", (route) => route.continue());
    await use(page);
  },
  blockRequest: async ({ page }, use) => {
    await page.routeFromHAR("./empty.har", {
      url: "**/graphql",
      notFound: "abort",
    });
    await use(page);
  },
});
