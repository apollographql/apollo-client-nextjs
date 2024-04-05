"use client";

import { QueryReference, useReadQuery } from "@apollo/client";

export function ClientChild({ queryRef }: { queryRef: QueryReference }) {
  const { data } = useReadQuery<any>(queryRef);
  return (
    <ul>
      {data.products.map(({ id, title }: any) => (
        <li key={id}>{title}</li>
      ))}
    </ul>
  );
}
