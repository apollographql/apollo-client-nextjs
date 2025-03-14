import type { Route } from "./+types/middleware";
import {
  useApolloClient,
  useQueryRefHandlers,
  useReadQuery,
} from "@apollo/client/react/index.js";
import { apolloMiddleware } from "~/apollo";
import { DEFERRED_QUERY } from "@integration-test/shared/queries";
import { useTransition } from "react";
import { apolloContext } from "@apollo/client-integration-react-router";

export const unstable_middleware = [apolloMiddleware]

export async function loader({ context }: Route.LoaderArgs) {
  const apollo = context.get(apolloContext)
  const queryRef = apollo.preloadQuery(DEFERRED_QUERY, {
    variables: { delayDeferred: 1000 },
  });

  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    queryRef,
  };
}

export default function Middleware({ loaderData }: Route.ComponentProps) {
  const { queryRef } = loaderData

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
