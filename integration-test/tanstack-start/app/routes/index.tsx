import { createFileRoute } from "@tanstack/react-router";
import { DEFERRED_QUERY } from "@integration-test/shared/queries";
import {
  useApolloClient,
  useQueryRefHandlers,
  useReadQuery,
} from "@apollo/client/index.js";
import { Suspense, useTransition } from "react";

export const Route = createFileRoute("/")({
  component: SuspenseWrapper,
  loader: async ({ context: { preloadQuery } }) => {
    const queryRef = preloadQuery(DEFERRED_QUERY, {
      variables: { delayDeferred: 500 },
    });
    return {
      queryRef,
    };
  },
});

/** temporary workaround for https://github.com/TanStack/router/issues/3117 - we can't fix this on our end */
function SuspenseWrapper() {
  return (
    <Suspense fallback="Loading...">
      <Home />
    </Suspense>
  );
}

function Home() {
  const { queryRef } = Route.useLoaderData();

  const { refetch } = useQueryRefHandlers(queryRef);
  const [refetching, startTransition] = useTransition();
  const { data } = useReadQuery(queryRef);
  const client = useApolloClient();

  return (
    <>
      <ul>
        {data.products.map(({ id, title, rating }) => (
          <li key={id}>
            {title}
            <br />
            Rating:{" "}
            <div style={{ display: "inline-block", verticalAlign: "text-top" }}>
              {rating?.value || ""}
              <br />
              {rating ? `Queried in ${rating.env} environment` : "loading..."}
            </div>
          </li>
        ))}
      </ul>
      <p>Queried in {data.env} environment</p>
      <button
        disabled={refetching}
        onClick={() => {
          client.cache.batch({
            update(cache) {
              for (const product of data.products) {
                cache.modify({
                  id: cache.identify(product),
                  fields: {
                    rating: () => null,
                  },
                });
              }
            },
          });
          startTransition(() => {
            refetch();
          });
        }}
      >
        {refetching ? "refetching..." : "refetch"}
      </button>
    </>
  );
}
