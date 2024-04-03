"use client";

import { useSuspenseQuery } from "@apollo/client";
import { QUERY } from "./shared";

export function ClientChild() {
  const { data } = useSuspenseQuery(QUERY, { context: { error: "always" } });
  return (
    <ul>
      {data.products.map(({ id, title }) => (
        <li key={id}>{title}</li>
      ))}
    </ul>
  );
}
