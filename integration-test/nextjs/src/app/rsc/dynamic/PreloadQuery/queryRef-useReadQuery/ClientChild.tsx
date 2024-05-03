"use client";

import { useQueryRefHandlers, useReadQuery } from "@apollo/client";
import { DynamicProductResult } from "../shared";
import { TransportedQueryReference } from "@apollo/experimental-nextjs-app-support/ssr";

export function ClientChild({
  queryRef,
}: {
  queryRef: TransportedQueryReference<DynamicProductResult>;
}) {
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
