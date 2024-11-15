"use client";

import {
  useApolloClient,
  useQueryRefHandlers,
  useReadQuery,
} from "@apollo/client";
import { DeferredDynamicProductResult } from "../shared";
import { TransportedQueryRef } from "@apollo/experimental-nextjs-app-support";

export function ClientChild({
  queryRef,
}: {
  queryRef: TransportedQueryRef<DeferredDynamicProductResult>;
}) {
  const { refetch } = useQueryRefHandlers(queryRef);
  const client = useApolloClient();
  const { data } = useReadQuery(queryRef);
  console.log(data);
  return (
    <>
      <ul>
        {data.products.map(({ id, title, rating }) => (
          <li key={id}>
            {title}
            <br />
            Rating: {rating || "..."}
          </li>
        ))}
      </ul>
      <p>Queried in {data.env} environment</p>
      <button
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
          refetch();
        }}
      >
        refetch
      </button>
    </>
  );
}
