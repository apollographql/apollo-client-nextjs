"use client";

import { useQueryRefHandlers, useReadQuery } from "@apollo/client";
import { DeferredDynamicProductResult } from "../shared";
import { TransportedQueryRef } from "@apollo/experimental-nextjs-app-support";
import { useTransition } from "react";

export function ClientChild({
  queryRef,
}: {
  queryRef: TransportedQueryRef<DeferredDynamicProductResult>;
}) {
  const { refetch } = useQueryRefHandlers(queryRef);
  const [refetching, startTransition] = useTransition();
  const { data } = useReadQuery(queryRef);

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
