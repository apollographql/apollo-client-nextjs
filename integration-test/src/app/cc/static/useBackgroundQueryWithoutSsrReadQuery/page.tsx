"use client";

import {
  useBackgroundQuery,
  useReadQuery,
} from "@apollo/experimental-nextjs-app-support/ssr";
import type { TypedDocumentNode } from "@apollo/client";
import { gql, QueryReference } from "@apollo/client";
import { Suspense, useState, useEffect } from "react";

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

export default function Page() {
  const [queryRef] = useBackgroundQuery(QUERY, { context: { delay: 2000 } });
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return (
    <>
      {isClient ? "rendered on client" : "rendered on server"}
      <Suspense fallback={<p>loading</p>}>
        {isClient ? <DisplayData queryRef={queryRef} /> : null}
      </Suspense>
    </>
  );
}

function DisplayData({ queryRef }: { queryRef: QueryReference<Data> }) {
  const { data } = useReadQuery(queryRef);
  globalThis.hydrationFinished?.();

  return (
    <ul>
      {data.products.map(({ id, title }) => (
        <li key={id}>{title}</li>
      ))}
    </ul>
  );
}
