import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import App from "./App";
import { resetNextSSRApolloSingletons } from "@apollo/experimental-nextjs-app-support/ssr";

afterEach(resetNextSSRApolloSingletons);

test("loads data", async () => {
  render(<App />);

  expect(screen.getByText("Loading...")).toBeInTheDocument();
  expect(
    await screen.findByText("Soft Warm Apollo Beanie")
  ).toBeInTheDocument();
  expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
});

test("is interactive", async () => {
  render(<App />);

  const counter = await screen.findByTestId("counter");
  expect(counter.textContent).toBe("0");

  await userEvent.click(screen.getByText("increment"));

  expect(counter.textContent).toBe("1");
});
