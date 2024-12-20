"use client";

import { useQueryRefHandlers, useReadQuery } from "@apollo/client";
import { DynamicProductResult } from "@integration-test/shared/queries";
import { TransportedQueryRef } from "@apollo/experimental-nextjs-app-support";

export function ClientChild({
  queryRef,
}: {
  queryRef: TransportedQueryRef<DynamicProductResult>;
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
