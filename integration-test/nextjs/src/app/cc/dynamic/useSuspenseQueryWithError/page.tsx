"use client";

import type { TypedDocumentNode } from "@apollo/client";
import { useSuspenseQuery, gql } from "@apollo/client";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { Suspense } from "react";

const QUERY: TypedDocumentNode<{
  products: {
    id: string;
    title: string;
  }[];
}> = gql`
  query dynamicProducts {
    products {
      id
      title
    }
  }
`;

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={"loading"}>
      <ErrorBoundary FallbackComponent={FallbackComponent}>
        <Component errorLevel={"ssr"} />
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

function Component({ errorLevel }: { errorLevel: "ssr" | "always" }) {
  const { data } = useSuspenseQuery(QUERY, {
    context: { error: errorLevel },
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
