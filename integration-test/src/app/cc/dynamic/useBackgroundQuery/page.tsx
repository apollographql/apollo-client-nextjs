"use client";

import {
  useBackgroundQuery,
  useReadQuery,
} from "@apollo/experimental-nextjs-app-support/ssr";
import type { TypedDocumentNode } from "@apollo/client";
import { gql, QueryReference } from "@apollo/client";
import { Suspense, useState } from "react";

interface Data {
  products: {
    id: string;
    title: string;
  }[];
}

const QUERY: TypedDocumentNode<Data> = gql`
  query dynamicProducts {
    products {
      id
      title
    }
  }
`;

export const dynamic = "force-dynamic";

export default function Page() {
  const [queryRef] = useBackgroundQuery(QUERY, { context: { delay: 2000 } });
  return (
    <Suspense fallback={<>loading</>}>
      <DisplayData queryRef={queryRef} />
    </Suspense>
  );
}

function DisplayData({ queryRef }: { queryRef: QueryReference<Data> }) {
  const { data } = useReadQuery(queryRef);
  return (
    <ul>
      {data.products.map(({ id, title }) => (
        <li key={id}>{title}</li>
      ))}
    </ul>
  );
}
