import { createFileRoute } from "@tanstack/react-router";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";

import { QUERY } from "@integration-test/shared/queries";
import { useSuspenseQuery } from "@apollo/client/index.js";
import { Suspense } from "react";

export const Route = createFileRoute("/useSuspenseQuery")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      errorLevel: search.errorLevel as "ssr" | "always" | undefined,
    };
  },
});

function RouteComponent() {
  const { errorLevel } = Route.useSearch();
  return (
    <Suspense fallback={"loading"}>
      <ErrorBoundary FallbackComponent={FallbackComponent}>
        <Component errorLevel={errorLevel} />
      </ErrorBoundary>
    </Suspense>
  );
}

function FallbackComponent({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <>
      <p>{error.message}</p>
    </>
  );
}

function Component({
  errorLevel,
}: {
  errorLevel: "ssr" | "always" | undefined;
}) {
  const { data } = useSuspenseQuery(QUERY, {
    context: { delay: 1000, ...(errorLevel ? { error: errorLevel } : {}) },
  });
  globalThis.hydrationFinished?.();

  return (
    <ul>
      {data.products.map(({ id, title }) => (
        <li key={id}>{title}</li>
      ))}
    </ul>
  );
}
