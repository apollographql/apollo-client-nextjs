import { DynamicProductResult, QUERY } from "@integration-test/shared/queries";
import {
  QueryRef,
  useQueryRefHandlers,
  useReadQuery,
  useSuspenseQuery,
  type DefaultContext,
} from "@apollo/client/index.js";
import "@integration-test/shared/errorLink";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

export const Route = createFileRoute("/preloadQuery/queryRef-useReadQuery")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      errorIn: search.errorIn as DefaultContext["error"],
    };
  },
  loaderDeps: ({ search: { errorIn } }) => ({ errorIn }),
  loader: async ({ context: { preloadQuery }, deps: { errorIn } }) => {
    const queryRef = preloadQuery(QUERY, {
      context: { delay: 1000, ...(errorIn ? { error: errorIn } : {}) },
    });
    return {
      queryRef,
    };
  },
});

function RouteComponent() {
  const { queryRef } = Route.useLoaderData();
  return (
    <Suspense fallback={<>loading</>}>
      <Child queryRef={queryRef} />
    </Suspense>
  );
}

function Child({ queryRef }: { queryRef: QueryRef<DynamicProductResult> }) {
  const { refetch } = useQueryRefHandlers(queryRef);
  const { data } = useReadQuery(queryRef);
  return (
    <>
      <ul>
        {data.products.map(({ id, title }: any) => (
          <li key={id}>{title}</li>
        ))}
      </ul>
      <p>Queried in {data.env} environment</p>
      <button onClick={() => refetch()}>refetch</button>
    </>
  );
}
