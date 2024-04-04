"use client";

import {
  QueryReference,
  useBackgroundQuery,
  useReadQuery,
  useSuspenseQuery,
} from "@apollo/client";
import { QUERY } from "./shared";

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
